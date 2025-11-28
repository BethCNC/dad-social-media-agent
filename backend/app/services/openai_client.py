"""OpenAI API client for content generation."""
import json
import logging
from pathlib import Path
from openai import AsyncOpenAI
from app.core.config import get_settings
from app.models.content import ContentBrief, GeneratedPlan, ShotInstruction

logger = logging.getLogger(__name__)
settings = get_settings()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# Path to client profile JSON
CLIENT_PROFILE_PATH = Path(__file__).parent.parent / "core" / "client_unicity_profile.json"


def load_client_profile() -> dict:
    """
    Load the client profile JSON configuration.
    
    Returns:
        dict: Client profile configuration
        
    Raises:
        FileNotFoundError: If profile file doesn't exist
        json.JSONDecodeError: If profile file is invalid JSON
    """
    if not CLIENT_PROFILE_PATH.exists():
        raise FileNotFoundError(
            f"Client profile not found at {CLIENT_PROFILE_PATH}"
        )
    
    with CLIENT_PROFILE_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def build_system_message(profile: dict) -> str:
    """
    Build the system message for OpenAI with client profile and compliance rules.
    
    Args:
        profile: Client profile dictionary from JSON
        
    Returns:
        str: System message for OpenAI
    """
    compliance_rules = profile.get("compliance", {}).get("rules", {})
    tone = profile.get("tone", {})
    products = profile.get("products", {})
    hashtags = profile.get("hashtags", {})
    disclaimers = profile.get("disclaimers", {})
    
    # Build compliance rules text
    compliance_text = []
    if compliance_rules.get("noDiseaseClaims"):
        compliance_text.append(
            "- NEVER claim that products cure, treat, or prevent specific diseases. "
            "Use language like 'supports', 'helps with', 'can make it easier to' instead."
        )
    if compliance_rules.get("noGuaranteedIncome"):
        compliance_text.append(
            "- NEVER promise specific income, guaranteed earnings, or 'get rich' results."
        )
    if compliance_rules.get("alwaysIncludeHealthDisclaimer"):
        compliance_text.append(
            "- ALWAYS include the health disclaimer at the end of the caption."
        )
    if compliance_rules.get("avoidCopyingOfficialTextVerbatim"):
        compliance_text.append(
            "- Write original content inspired by the brand, but don't copy official text word-for-word."
        )
    
    # Build products context
    products_text = []
    for product_key, product_info in products.items():
        label = product_info.get("label", "")
        focus_points = product_info.get("focus", [])
        if label and focus_points:
            products_text.append(
                f"- {label}: Focus on {', '.join(focus_points)}"
            )
    
    # Build system message
    system_message = f"""You are an AI assistant helping create short-form vertical videos for TikTok and Instagram.

CLIENT CONTEXT:
- The client is an independent Unicity distributor creating content for their personal brand.
- Brand name: {profile.get('brandName', 'Unicity Wellness')}
- Target audience: Everyday people trying to feel better, have more stable energy, and improve their habits.

TONE & VOICE:
- Overall tone: {tone.get('overall', 'friendly, educational, supportive')}
- Reading level: {tone.get('readingLevel', '9th grade')} - use short sentences, avoid jargon
- Perspective: {tone.get('personPerspective', 'first person or conversational')}
- Use language like "supports", "helps with", "can make it easier to" rather than "fixes" or "cures"
- Keep claims realistic and modest - emphasize lifestyle + product, not magical fixes

PRODUCTS TO REFERENCE (when relevant):
{chr(10).join(products_text) if products_text else "- Focus on Feel Great System, Unimate, and Balance when relevant to the topic"}

COMPLIANCE RULES (CRITICAL - MUST FOLLOW):
{chr(10).join(compliance_text)}

HASHTAGS:
- Always include these core hashtags: {', '.join(hashtags.get('general', []))}
- You may add up to {hashtags.get('maxExtraPerPost', 5)} additional relevant hashtags per post

DISCLAIMERS:
- Health disclaimer (MUST include at end of caption): {disclaimers.get('health', '')}
- General disclaimer: {disclaimers.get('general', '')}

OUTPUT FORMAT:
You must return ONLY valid JSON matching this exact schema:
{{
  "script": "string - spoken script for the video (20-40 seconds, conversational, friendly)",
  "caption": "string - social media caption with hook, body, CTA, hashtags, and health disclaimer at the end",
  "shot_plan": [
    {{
      "description": "string - clear visual description for stock video search (e.g., 'person drinking morning coffee', 'healthy meal preparation')",
      "duration_seconds": 4
    }}
  ]
}}

CAPTION REQUIREMENTS:
- Start with an engaging hook about a common pain point (energy crashes, cravings, habit struggles)
- Include 1-3 sentences explaining the topic simply
- Add a soft CTA (e.g., "If you're curious, here's more info: [link]")
- Include core hashtags plus up to {hashtags.get('maxExtraPerPost', 5)} relevant additional ones
- ALWAYS end with the health disclaimer: {disclaimers.get('health', '')}

SHOT PLAN REQUIREMENTS:
- Create 3-6 shot descriptions
- Each description should be clear enough for stock video search
- Total duration should align with script length (typically 20-40 seconds)
- Focus on lifestyle, wellness, and relatable everyday moments

Remember: Keep everything simple, supportive, and compliant. No medical claims, no income promises."""
    
    return system_message


async def generate_content_plan(brief: ContentBrief) -> GeneratedPlan:
    """
    Generate content plan using OpenAI gpt-4o with Unicity client profile.
    
    Args:
        brief: Content brief with idea, platforms, tone, and optional length
        
    Returns:
        GeneratedPlan with script, caption, and shot_plan
        
    Raises:
        FileNotFoundError: If client profile cannot be loaded
        ValueError: If OpenAI response is invalid or empty
        Exception: If OpenAI API call fails
    """
    # Load client profile
    try:
        client_profile = load_client_profile()
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.error(f"Failed to load client profile: {e}")
        raise
    
    # Build system message with profile
    system_message = build_system_message(client_profile)
    
    # Build user message from brief
    length_hint = ""
    if brief.length_seconds:
        length_hint = f" Target approximately {brief.length_seconds} seconds of spoken content."
    else:
        length_hint = " Target 20-40 seconds of spoken content."

    user_message = f"""Create a short-form video plan for the following:

Idea/Topic: {brief.idea}
Tone: {brief.tone}
Platforms: {', '.join(brief.platforms)}
{length_hint}

Generate:
1. A conversational script that matches the tone and can be spoken in the target length
2. A social media caption with hook, body, CTA, relevant hashtags (including core Unicity hashtags), and the required health disclaimer at the end
3. A shot plan with 3-6 clear visual descriptions suitable for stock video search"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from OpenAI")

        # Parse JSON response
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI JSON response: {e}")
            logger.error(f"Raw response: {content[:500]}")
            raise ValueError("Invalid JSON response from AI") from e

        # Validate and construct GeneratedPlan
        shot_plan = [
            ShotInstruction(**shot) for shot in data.get("shot_plan", [])
        ]

        return GeneratedPlan(
            script=data.get("script", ""),
            caption=data.get("caption", ""),
            shot_plan=shot_plan,
        )

    except Exception as e:
        logger.error(f"OpenAI API error: {type(e).__name__}: {str(e)}")
        raise

