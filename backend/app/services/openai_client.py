"""OpenAI API client for content generation."""
import json
import logging
from openai import OpenAI
from app.core.config import get_settings
from app.models.content import ContentBrief, GeneratedPlan, ShotInstruction

logger = logging.getLogger(__name__)
settings = get_settings()
client = OpenAI(api_key=settings.OPENAI_API_KEY)


def generate_content_plan(brief: ContentBrief) -> GeneratedPlan:
    """
    Generate content plan using OpenAI gpt-4o.
    
    Args:
        brief: Content brief with idea, platforms, tone, and optional length
        
    Returns:
        GeneratedPlan with script, caption, and shot_plan
        
    Raises:
        Exception: If OpenAI API call fails or JSON parsing fails
    """
    system_prompt = """You are an AI assistant helping create short-form vertical videos for TikTok and Instagram.

The client is an older, non-technical person who needs simple, clear language. Your responses must be JSON only, matching this exact schema:
{
  "script": "string - spoken script for the video (aim for conversational, friendly tone)",
  "caption": "string - social media caption including 3-5 relevant hashtags",
  "shot_plan": [
    {
      "description": "string - what the shot should show (clear enough for stock video search)",
      "duration_seconds": 4
    }
  ]
}

Guidelines:
- Script should be conversational and easy to read aloud
- Caption should be friendly and include relevant hashtags
- Create 3-6 shot descriptions that a stock video search engine could understand
- Keep language simple and clear for a non-technical audience"""

    length_hint = ""
    if brief.length_seconds:
        length_hint = f" Aim for approximately {brief.length_seconds} seconds of spoken content."

    user_prompt = f"""Create a short-form video plan for the following:

Idea/Topic: {brief.idea}
Tone: {brief.tone}
Platforms: {', '.join(brief.platforms)}
{length_hint}

Generate a script that can be spoken in 20-40 seconds (unless a specific length was provided), a social media caption with hashtags, and a shot plan with 3-6 clear shot descriptions."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
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

