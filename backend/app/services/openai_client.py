"""OpenAI API client for content generation."""
import json
import logging
from pathlib import Path
from typing import List, Optional
from openai import AsyncOpenAI
from app.core.config import get_settings
from app.models.content import ContentBrief, GeneratedPlan, ShotInstruction
from app.models.schedule import ScheduleRequest, ScheduledContentItem
from app.models.weekly_schedule import WeeklyScheduleRequest, WeeklyPost
from datetime import date, timedelta

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

TIKTOK PLAYBOOK BEST PRACTICES (2025-2026):

CONTENT MIX DISTRIBUTION:
- 60-70% pure value content (education, routines, stories without product mention)
- 20-30% value + soft product integration (product appears naturally in routine)
- <10% direct CTA content (still compliant, not MLM-y)

CONTENT PILLARS:
1. Education ("why") - Short explanations about energy, cravings, routines, habits. Simple metaphors/visuals, no clinical promises.
2. Routines & Habits ("how") - Morning/evening routines, habit stacks, "what I do before bed" type content.
3. Story-based ("me too" connection) - Brief before/after feelings (not medical transformations), relatable struggles.
4. Soft Product Integration - Product shows up inside routine naturally (e.g., drink during morning walk, supplement as part of meal).

VIDEO STRUCTURE (CRITICAL):
- Hook (0-3 seconds): Must grab attention immediately or viewers scroll. Use pain points: "If you crash every day at 3pm, watch this."
- Context/Empathy (3-8 seconds): "I used to feel wiped by mid-afternoon..."
- Value Steps (8-30 seconds): Tip 1, 2, 3 with B-roll of daily life.
- Soft CTA (last 3-5 seconds): "If this was helpful, save this for later" or "If you're curious what I use, link's in my bio."

VIDEO LENGTH:
- Sweet spot: 15-45 seconds for most videos
- Experiment with 45-60 seconds for deeper stories
- Completion rate beats raw length - prioritize retention

HOOK REQUIREMENTS:
- Must hook in first 1-3 seconds or viewers scroll
- Focus on high retention, not clickbait
- Use common pain points: energy crashes, cravings, habit struggles
- Make it clear what value the video provides

TIKTOK SEO (Search Engine Optimization):
- TikTok is now a search engine - keywords matter as much as FYP
- Place main keyword in:
  * On-screen text in first 3 seconds (e.g., "3 tips to reduce afternoon energy crashes")
  * Spoken audio near the start
  * Caption with natural language + key phrase
  * Hashtags: Mix 1-2 specific (#metabolichealth, #bloodsugartips) + 1-2 broad (#wellness, #healthyliving)
- Suggested keyword themes: "how to feel more stable energy", "evening routine for better sleep", "how to build healthier snack habits", "what I eat for more stable energy"
- Stick to behavior/lifestyle keywords, not disease names

SERIES THINKING:
- Create 3-5 recurring series (e.g., "Energy Tip Tuesday", "Evening Reset Routines", "My 40+ Wellness Check-in")
- Series help algorithm understand niche and create anticipation
- Distribute series across the month for consistency

CONTENT PILLAR DISTRIBUTION (for monthly schedules):
- Education: ~40-50% of posts
- Routines & Habits: ~20-30% of posts
- Story-based: ~10-15% of posts
- Soft Product Integration: ~20-30% of posts

Remember: Keep everything simple, supportive, and compliant. No medical claims, no income promises. Optimize for watch time, hooks, and clarity."""
    
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


async def generate_monthly_schedule(request: ScheduleRequest) -> list[ScheduledContentItem]:
    """
    Generate a monthly schedule with full content for each posting day.
    
    Args:
        request: ScheduleRequest with start_date, platforms, posts_per_week
        
    Returns:
        List of ScheduledContentItem with full content for each posting day
        
    Raises:
        FileNotFoundError: If client profile cannot be loaded
        ValueError: If OpenAI response is invalid
        Exception: If OpenAI API call fails
    """
    # Load client profile
    try:
        client_profile = load_client_profile()
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.error(f"Failed to load client profile: {e}")
        raise
    
    # Build enhanced system message with TikTok playbook rules
    system_message = build_system_message(client_profile)
    
    # Calculate posting days (approximately posts_per_week posts per week)
    # For a month, we'll generate content for the specified number of days
    # The actual day selection will be handled by the schedule service
    total_posts = int((request.posts_per_week / 7) * 30)  # Approximate posts for 30 days
    
    # Calculate end date (30 days from start)
    end_date = request.start_date + timedelta(days=29)
    
    # Build user message for schedule generation
    user_message = f"""Generate a monthly posting schedule for {request.start_date} to {end_date}.

Requirements:
- {request.posts_per_week} posts per week ({total_posts} posts total for the month)
- Platforms: {', '.join(request.platforms)}
- Content mix: 60-70% pure value, 20-30% value + product, <10% direct CTA
- Create 3-5 recurring series (e.g., "Energy Tip Tuesday", "Evening Reset Routines", "My 40+ Wellness Check-in")
- Each post must include:
  - Hook (1-3 seconds, high retention focus, must grab attention immediately)
  - Full script (15-45 seconds, following structure: Hook → Context → Value Steps → Soft CTA)
  - Caption with TikTok SEO keywords (keywords in caption, hashtags mix of specific + broad)
  - Shot plan (3-6 shots, clear visual descriptions for stock video search)
  - Suggested keywords for on-screen text and spoken audio (TikTok SEO)
  - Content pillar assignment (education, routine, story, product_integration)
  - Series name if part of a recurring series

Distribute content pillars:
- Education: ~40-50% of posts
- Routines & Habits: ~20-30% of posts
- Story-based: ~10-15% of posts
- Soft Product Integration: ~20-30% of posts

For each post, return a JSON object with:
- date: ISO date string (YYYY-MM-DD)
- day_of_week: day name (Monday, Tuesday, etc.)
- content_pillar: one of "education", "routine", "story", "product_integration"
- series_name: series name if applicable (e.g., "Energy Tip Tuesday"), null otherwise
- topic: brief topic description
- hook: the 1-3 second hook text
- script: full script (15-45 seconds)
- caption: full caption with hook, body, CTA, hashtags, and health disclaimer
- shot_plan: array of {{"description": "...", "duration_seconds": N}} objects
- suggested_keywords: array of keywords for TikTok SEO (on-screen text, audio, caption)
- template_type: "video" (default)

Return ONLY a JSON object with this structure:
{{
  "items": [
    // Array of {total_posts} objects matching the ScheduledContentItem structure
  ]
}}"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.8,  # Slightly higher for more creative series ideas
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

        # The response should have an "items" key with the array
        items_data = []
        if isinstance(data, list):
            items_data = data
        elif "items" in data:
            items_data = data["items"]
        elif "schedule" in data:
            items_data = data["schedule"]
        else:
            # Try to find any array in the response
            for key, value in data.items():
                if isinstance(value, list):
                    items_data = value
                    break
        
        if not items_data:
            raise ValueError("No schedule items found in response")

        # Validate and construct ScheduledContentItem objects
        schedule_items = []
        for item_data in items_data:
            # Parse date
            item_date = date.fromisoformat(item_data.get("date", ""))
            
            # Parse shot_plan
            shot_plan = [
                ShotInstruction(**shot) for shot in item_data.get("shot_plan", [])
            ]
            
            schedule_item = ScheduledContentItem(
                date=item_date,
                day_of_week=item_data.get("day_of_week", ""),
                content_pillar=item_data.get("content_pillar", "education"),
                series_name=item_data.get("series_name"),
                topic=item_data.get("topic", ""),
                hook=item_data.get("hook", ""),
                script=item_data.get("script", ""),
                caption=item_data.get("caption", ""),
                shot_plan=shot_plan,
                suggested_keywords=item_data.get("suggested_keywords", []),
                template_type=item_data.get("template_type", "video"),
            )
            schedule_items.append(schedule_item)

        return schedule_items

    except Exception as e:
        logger.error(f"OpenAI API error in schedule generation: {type(e).__name__}: {str(e)}")
        raise


def build_system_message_with_quotes(profile: dict, quotes: List[str]) -> str:
    """
    Build system message with content database quotes injected.
    
    Args:
        profile: Client profile dictionary
        quotes: List of quote texts from content database
        
    Returns:
        Enhanced system message with quotes
    """
    base_message = build_system_message(profile)
    
    # Add quotes section
    quotes_section = "\n\nUNICITY CONTENT DATABASE QUOTES (Use as inspiration for language and messaging):\n"
    for i, quote in enumerate(quotes[:15], 1):  # Limit to 15 quotes to avoid token limits
        quotes_section += f"{i}. {quote}\n"
    
    quotes_section += "\nUse these quotes as inspiration for authentic Unicity language, but create original content. Don't copy verbatim."
    
    return base_message + quotes_section


async def generate_weekly_schedule(
    request: WeeklyScheduleRequest,
    quotes: Optional[List[str]] = None
) -> List[WeeklyPost]:
    """
    Generate a weekly schedule with 7 posts (one per day).
    
    AI decides image vs video template type based on content:
    - Education tips → Video (better for explanation)
    - Product showcases → Image (static product shots)
    - Routines → Video (showing actions)
    - Quotes/inspiration → Image (text overlay on image)
    
    Args:
        request: WeeklyScheduleRequest with week_start_date and platforms
        quotes: Optional list of quote texts from content database
        
    Returns:
        List of WeeklyPost with full content for each day
        
    Raises:
        FileNotFoundError: If client profile cannot be loaded
        ValueError: If OpenAI response is invalid
        Exception: If OpenAI API call fails
    """
    # Load client profile
    try:
        client_profile = load_client_profile()
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.error(f"Failed to load client profile: {e}")
        raise
    
    # Build system message with quotes if provided
    if quotes:
        system_message = build_system_message_with_quotes(client_profile, quotes)
    else:
        system_message = build_system_message(client_profile)
    
    # Calculate week dates (Monday to Sunday)
    week_start = request.week_start_date
    # Ensure it's Monday (0 = Monday)
    days_since_monday = week_start.weekday()
    if days_since_monday != 0:
        week_start = week_start - timedelta(days=days_since_monday)
    
    week_end = week_start + timedelta(days=6)
    
    # Build user message for weekly generation
    user_message = f"""Generate a weekly posting schedule for {week_start} to {week_end} (7 days, one post per day).

Requirements:
- Generate exactly 7 posts (one for each day: Monday through Sunday)
- Platforms: {', '.join(request.platforms)}
- Content mix: ~40% education, ~30% routine, ~15% story, ~15% product_integration
- Create 2-3 recurring series (e.g., "Energy Tip Tuesday", "Evening Reset Routines", "My 40+ Wellness Check-in")
- AI must decide template_type for each post:
  * Use "video" for: Education tips (better for explanation), Routines (showing actions), Story-based content
  * Use "image" for: Product showcases (static product shots), Quotes/inspiration (text overlay on image), Simple tips
- Each post must include:
  - Hook (1-3 seconds, high retention focus, must grab attention immediately)
  - Full script (15-45 seconds, following structure: Hook → Context → Value Steps → Soft CTA)
  - Caption with TikTok SEO keywords (keywords in caption, hashtags mix of specific + broad)
  - Shot plan (3-6 shots, clear visual descriptions for stock video/image search)
  - Suggested keywords for on-screen text and spoken audio (TikTok SEO)
  - Content pillar assignment (education, routine, story, product_integration)
  - Series name if part of a recurring series
  - template_type: "image" or "video" (AI decides based on content type)

For each post, return a JSON object with:
- post_date: ISO date string (YYYY-MM-DD)
- post_time: null (no specific time)
- content_pillar: one of "education", "routine", "story", "product_integration"
- series_name: series name if applicable (e.g., "Energy Tip Tuesday"), null otherwise
- topic: brief topic description
- hook: the 1-3 second hook text
- script: full script (15-45 seconds)
- caption: full caption with hook, body, CTA, hashtags, and health disclaimer
- shot_plan: array of {{"description": "...", "duration_seconds": N}} objects
- suggested_keywords: array of keywords for TikTok SEO (on-screen text, audio, caption)
- template_type: "image" or "video" (AI decides based on content type)

Return ONLY a JSON object with this structure:
{{
  "posts": [
    // Array of exactly 7 objects, one for each day Monday-Sunday
  ]
}}"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.8,  # Higher for creative series ideas
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

        # Extract posts array
        posts_data = []
        if isinstance(data, list):
            posts_data = data
        elif "posts" in data:
            posts_data = data["posts"]
        else:
            # Try to find any array in the response
            for key, value in data.items():
                if isinstance(value, list):
                    posts_data = value
                    break
        
        if not posts_data:
            raise ValueError("No posts found in response")
        
        if len(posts_data) != 7:
            logger.warning(f"Expected 7 posts, got {len(posts_data)}")

        # Validate and construct WeeklyPost objects
        weekly_posts = []
        for i, post_data in enumerate(posts_data[:7]):  # Ensure max 7 posts
            # Calculate post date (Monday + i days)
            post_date = week_start + timedelta(days=i)
            
            # Parse shot_plan
            shot_plan = [
                ShotInstruction(**shot) for shot in post_data.get("shot_plan", [])
            ]
            
            # Get template type (AI decides)
            template_type = post_data.get("template_type", "video").lower()
            if template_type not in ["image", "video"]:
                # Default based on content pillar
                pillar = post_data.get("content_pillar", "education")
                if pillar in ["education", "routine", "story"]:
                    template_type = "video"
                else:
                    template_type = "image"
            
            weekly_post = WeeklyPost(
                post_date=post_date,
                post_time=None,  # No specific time for now
                content_pillar=post_data.get("content_pillar", "education"),
                series_name=post_data.get("series_name"),
                topic=post_data.get("topic", ""),
                hook=post_data.get("hook", ""),
                script=post_data.get("script", ""),
                caption=post_data.get("caption", ""),
                template_type=template_type,
                shot_plan=shot_plan,
                suggested_keywords=post_data.get("suggested_keywords", []),
                status="draft",
            )
            weekly_posts.append(weekly_post)

        return weekly_posts

    except Exception as e:
        logger.error(f"OpenAI API error in weekly schedule generation: {type(e).__name__}: {str(e)}")
        raise

