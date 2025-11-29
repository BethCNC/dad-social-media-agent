"""OpenAI API client for content generation."""
import json
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
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
      "description": "string - clear visual description for stock video search WITHOUT people or faces (e.g., 'coffee cup on table', 'healthy meal on plate', 'sunrise nature scene')",
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

SHOT PLAN REQUIREMENTS (CRITICAL FOR RELEVANT ASSET SEARCH):
- Create 3-6 shot descriptions that are OPTIMIZED for stock video/image search engines
- Each description must be SPECIFIC and SEARCHABLE - use concrete, visual keywords
- Total duration should align with script length (typically 20-40 seconds)
- Focus on lifestyle, wellness, and relatable everyday moments

SEARCH OPTIMIZATION FOR SHOT DESCRIPTIONS (UNICITY WELLNESS THEMES):
- Use SPECIFIC, CONCRETE keywords that stock libraries use, ALIGNED WITH UNICITY WELLNESS THEMES:
  * Colors: "golden sunrise", "green smoothie", "white coffee cup", "fresh vegetables", "healthy meal"
  * Actions: "pouring", "stirring", "steaming", "slicing", "arranging", "preparing", "serving"
  * Settings: "wooden table", "marble counter", "outdoor patio", "kitchen counter", "peaceful morning", "cozy evening"
  * Mood/Time: "morning light", "warm lighting", "sunset", "cozy", "peaceful", "energizing"
  * Composition: "close-up", "overhead view", "side angle", "aerial"
- UNICITY-SPECIFIC WELLNESS KEYWORDS to include when relevant:
  * Metabolic health themes: "healthy meal", "balanced plate", "fresh ingredients", "whole foods", "nutritious"
  * Energy themes: "morning routine", "sunrise", "coffee", "green smoothie", "energizing drink"
  * Routine themes: "morning setup", "evening preparation", "meal prep", "kitchen scene", "peaceful environment"
  * Wellness lifestyle: "nature scenes", "outdoor wellness", "healthy lifestyle objects", "wellness products"
- Combine multiple searchable terms: "healthy breakfast bowl on wooden table morning light"
- Match shot descriptions to script content - if script mentions "coffee", shot should show coffee-related visuals
- Align with content pillar:
  * Education: abstract wellness concepts, nature metaphors, healthy food close-ups, metabolic health visuals
  * Routine: morning/evening scenes, objects in use, peaceful environments, meal preparation
  * Story: before/after objects, transformation visuals, relatable wellness scenes
  * Product: product close-ups, product in context, lifestyle integration, wellness products

CRITICAL: NEVER include people, faces, or human subjects in shot descriptions
- Use descriptions like: "coffee cup on wooden table morning light", "healthy meal on white plate overhead view", "sunrise over mountains time-lapse", "hands preparing vegetables close-up", "workout equipment gym floor", "nature scenes forest path", "product close-up on marble surface"
- Avoid: "person doing X", "woman/man", "people", "face", "hands holding" (unless hands are the only visible part)
- Focus on objects, nature, food, products, environments, and abstract lifestyle scenes

EXAMPLE HIGH-QUALITY SHOT DESCRIPTIONS (UNICITY WELLNESS ALIGNED):
- "coffee cup steam rising morning light wooden table peaceful"
- "healthy breakfast bowl overhead view colorful fresh ingredients"
- "sunrise over mountains time-lapse golden hour nature"
- "fresh vegetables arranged on cutting board kitchen counter morning light"
- "green smoothie in glass jar marble background healthy drink"
- "evening routine candles warm lighting peaceful bedroom"
- "wellness product bottle close-up white background studio lighting"
- "balanced meal plate colorful vegetables whole foods"
- "morning routine objects arranged wooden table natural light"
- "peaceful nature scene forest path morning light"
- "healthy meal prep ingredients fresh vegetables kitchen"
- "energizing drink glass jar morning light counter"

TIKTOK ALGORITHM OPTIMIZATION (2025-2026):
TikTok is a personalized recommendation engine that test-drives every video in stages. The algorithm rewards:

1. WATCH TIME / COMPLETION RATE (MOST IMPORTANT):
   - Videos watched to the end (or replayed) are far more likely to be pushed
   - Short, high-retention videos beat long, boring ones
   - Completion rate beats raw length - prioritize retention over duration
   - Target: 15-45 seconds for most videos (sweet spot)
   - Experiment with 45-60 seconds only for deeper stories

2. EARLY ENGAGEMENT:
   - Likes, comments, shares, saves in the first "test batch" viewers matter most
   - Encourage engagement: "save this for later", "send to someone who needs this"

3. TOPIC CLARITY:
   - Caption + on-screen text + spoken keyword helps TikTok know WHO to show it to
   - Use clear, searchable keywords throughout

CONTENT STRATEGY & PILLARS:

CONTENT MIX DISTRIBUTION (2025-2026):
- 60-70% pure value content (education, routines, stories without product mention)
- 20-30% value + soft product integration (product appears naturally in routine)
- <10% direct CTA content (still compliant, not MLM-y)
This keeps the account from feeling like an infomercial and aligns with algorithm rewards.

CONTENT PILLARS:
1. Education ("why") - Short explanations about energy, cravings, routines, habits. Simple metaphors/visuals, no clinical promises.
2. Routines & Habits ("how") - Morning/evening routines, habit stacks, "what I do before bed" type content.
3. Story-based ("me too" connection) - Brief before/after FEELINGS (not medical transformations), relatable struggles.
4. Soft Product Integration - Product shows up inside routine naturally (e.g., drink during morning walk, supplement as part of meal).

CONTENT PILLAR DISTRIBUTION (for schedules):
- Education: ~40-50% of posts
- Routines & Habits: ~20-30% of posts
- Story-based: ~10-15% of posts
- Soft Product Integration: ~20-30% of posts

VIDEO STRUCTURE (CRITICAL - MUST FOLLOW):

1. HOOK (0-3 seconds) - ABSOLUTELY CRITICAL:
   - MUST grab attention in first 1-3 seconds or viewers scroll
   - Use pain points: "If you crash every day at 3pm, watch this."
   - Examples: "Here are 3 things I changed about my mornings after 40."
   - Focus on high retention, not clickbait
   - Make it clear what value the video provides
   - Common pain points: energy crashes, cravings, habit struggles

2. CONTEXT/EMPATHY (3-8 seconds):
   - Build connection: "I used to feel wiped by mid-afternoon..."
   - Create "me too" moment

3. VALUE STEPS (8-30 seconds):
   - Tip 1, 2, 3 with clear structure
   - Show B-roll of daily life (via shot plan)
   - Keep it actionable and simple

4. SOFT CTA (last 3-5 seconds):
   - "If this was helpful, save this for later."
   - "If you're curious what I use in my routine, the link's in my bio."
   - NEVER use: "DM me to join my team", "Make $X a month", "This cures X"

TIKTOK SEO (Search Engine Optimization) - CRITICAL:

TikTok has become a search engine. SEO matters as much as FYP. Users search: "how to...", "best...", "does X help with...", "daily routine for..."

KEYWORD PLACEMENT (MUST include main keyword in ALL of these):
1. ON-SCREEN TEXT in first 3 seconds:
   - Text overlay: "3 tips to reduce afternoon energy crashes"
   - Reinforce hook visually
   - Highlight step numbers
   - Add key phrases for SEO

2. SPOKEN AUDIO:
   - Say the main keyword phrase once near the start of the script
   - Natural integration, not forced

3. CAPTION:
   - Short, natural language + key phrase
   - Example: "Feeling that 3pm crash? Here are 3 habits that helped me stabilize my energy (no crazy hacks)."

4. HASHTAGS:
   - Mix of 1-2 SPECIFIC (#metabolichealth, #bloodsugartips) + 1-2 BROAD (#wellness, #healthyliving)
   - Total: 3-5 hashtags per post

5. SUGGESTED KEYWORD THEMES (for this niche):
   - "how to feel more stable energy"
   - "evening routine for better sleep"
   - "how to build healthier snack habits"
   - "what I eat for more stable energy"
   - Stick to BEHAVIOR/LIFESTYLE keywords, NOT disease names

COMPLIANCE & SAFETY (CRITICAL):

TikTok BANS MLM promotion and restricts medical claims. ALWAYS:

FORBIDDEN LANGUAGE:
- "Join my team", "DM me to learn how to make $$$", "Make $X a month"
- "This cures X", "This will fix your [diagnosed condition]"
- Disease names in claims context
- Income or business opportunity promises

SAFE POSITIONING:
- Focus on education, lifestyle, and "supporting wellness"
- Stories, routines, tips, habits
- Soft CTA → "learn more" (link in bio), NOT "join my downline"
- Use "supports", "helps with", "can make it easier to" - NOT "fixes" or "cures"

SERIES THINKING:

Create 3-5 recurring series (e.g., "Energy Tip Tuesday", "Evening Reset Routines", "My 40+ Wellness Check-in")
- Series help algorithm understand niche
- Create anticipation
- Distribute across schedule for consistency
- Think in series, not one-offs

OUTPUT REQUIREMENTS:

For each content piece, you MUST provide:
1. Script with clear hook (1-3 seconds), context, value steps, soft CTA
2. Caption with hook, body, soft CTA, hashtags (3-5 total), health disclaimer
3. Shot plan (3-6 shots, NO people/faces)
4. Suggested keywords for on-screen text (include in script as notes or separate field)
5. Main keyword phrase that should be spoken and appear in caption

Remember: Optimize for WATCH TIME, HOOK, and CLARITY. Keep everything simple, supportive, and compliant. No medical claims, no income promises."""
    
    return system_message


async def generate_content_plan(brief: ContentBrief, holiday_context: Optional[dict] = None) -> GeneratedPlan:
    """
    Generate content plan using OpenAI gpt-4o with Unicity client profile.
    
    Args:
        brief: Content brief with idea, platforms, tone, and optional length
        holiday_context: Optional holiday context dictionary with holidays_on_date, upcoming_holidays, etc.
        
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
    
    # Determine the topic/idea based on mode
    topic = brief.user_topic or brief.idea or ""
    
    # If mode is "auto" and we have holiday context, use holiday-based topic
    if brief.mode == "auto" and holiday_context:
        marketing_holidays = holiday_context.get("marketing_relevant_holidays", [])
        if marketing_holidays:
            # Use the first marketing-relevant holiday as the topic
            holiday = marketing_holidays[0]
            topic = f"Create content related to {holiday['name']} (holiday on {holiday['date']})"
        elif brief.use_holidays:
            topic = "Create wellness content that could be relevant for upcoming holidays or seasonal themes"
    
    # Build user message from brief
    length_hint = ""
    if brief.length_seconds:
        length_hint = f" Target approximately {brief.length_seconds} seconds of spoken content."
    else:
        length_hint = " Target 20-40 seconds of spoken content."
    
    # Build holiday context section if available
    holiday_section = ""
    if holiday_context:
        holidays_on_date = holiday_context.get("holidays_on_date", [])
        upcoming_holidays = holiday_context.get("marketing_relevant_holidays", [])
        
        if holidays_on_date or upcoming_holidays:
            holiday_section = "\n\nHOLIDAY CONTEXT:\n"
            if holidays_on_date:
                holiday_names = [h["name"] for h in holidays_on_date]
                holiday_section += f"- Today is: {', '.join(holiday_names)}\n"
            if upcoming_holidays:
                upcoming_list = [f"{h['name']} ({h['date']})" for h in upcoming_holidays[:3]]
                holiday_section += f"- Upcoming holidays: {', '.join(upcoming_list)}\n"
            holiday_section += "- If relevant, tastefully mention the holiday (greetings, themes, gratitude) while staying compliant.\n"
            holiday_section += "- Keep holiday mentions natural and wellness-focused, not forced.\n"

    user_message = f"""Create a short-form video plan for the following:

Idea/Topic: {topic}
Tone: {brief.tone}
Platforms: {', '.join(brief.platforms)}
{length_hint}{holiday_section}

CRITICAL REQUIREMENTS:
1. HOOK (first 1-3 seconds): Must grab attention immediately with a pain point or clear value promise
2. SCRIPT STRUCTURE: Hook → Context/Empathy (3-8s) → Value Steps (8-30s) → Soft CTA (last 3-5s)
3. TIKTOK SEO: Identify the main keyword phrase and ensure it appears in:
   - On-screen text suggestion (for first 3 seconds)
   - Spoken audio (near start of script)
   - Caption (natural integration)
   - Hashtags (1-2 specific + 1-2 broad, total 3-5)
4. COMPLIANCE: No MLM language, no medical claims, no income promises. Use soft CTAs only.

Generate:
1. A conversational script (15-45 seconds) following the structure above
   - Include notes for on-screen text overlays (especially in first 3 seconds with main keyword)
   - Ensure main keyword is spoken near the start
2. A social media caption with:
   - Hook (first line, attention-grabbing)
   - Body (1-3 sentences explaining value)
   - Soft CTA (e.g., "If you're curious, link's in my bio")
   - Hashtags: Core Unicity hashtags + 1-2 specific + 1-2 broad (3-5 total)
   - Health disclaimer at the end
3. A shot plan with 3-6 clear visual descriptions optimized for stock video/image search
   - Each description should be SPECIFIC and SEARCHABLE with concrete keywords
   - ALIGN WITH UNICITY WELLNESS THEMES: Include wellness, healthy lifestyle, metabolic health, energy, routine keywords
   - Include: colors, actions, settings, lighting, composition (e.g., "golden sunrise over mountains time-lapse", "green smoothie in glass jar marble counter morning light healthy")
   - Match shot descriptions to script content - if script mentions coffee, show coffee-related visuals
   - CRITICAL: All shot descriptions must EXCLUDE people, faces, and human subjects (HEADLESS ACCOUNT)
   - Focus on: healthy meals, fresh ingredients, wellness objects, peaceful environments, nature scenes, routine objects, products
   - Total duration should align with script length
   - Use 4-6 specific keywords per shot description including wellness/healthy terms for better search results
   - Examples: "healthy breakfast bowl colorful fresh ingredients morning light", "peaceful nature scene forest path wellness", "wellness product bottle close-up white background"""

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


async def generate_monthly_schedule(request: ScheduleRequest, holiday_contexts: Optional[dict] = None) -> list[ScheduledContentItem]:
    """
    Generate a monthly schedule with full content for each posting day.
    
    Args:
        request: ScheduleRequest with start_date, platforms, posts_per_week
        holiday_contexts: Optional dictionary mapping dates (ISO strings) to holiday context
        
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
    
    # Build holiday context section if available
    holiday_section = ""
    if holiday_contexts:
        holiday_section = "\n\nHOLIDAY CONTEXT FOR THIS MONTH:\n"
        for date_str, context in holiday_contexts.items():
            holidays_on_date = context.get("holidays_on_date", [])
            upcoming = context.get("marketing_relevant_holidays", [])
            if holidays_on_date:
                names = [h["name"] for h in holidays_on_date]
                holiday_section += f"- {date_str}: {', '.join(names)}\n"
            if upcoming:
                upcoming_list = [f"{h['name']} ({h['date']})" for h in upcoming[:2]]
                holiday_section += f"  Upcoming: {', '.join(upcoming_list)}\n"
        holiday_section += "- When relevant, tastefully mention holidays (greetings, themes, gratitude) while staying compliant.\n"
        holiday_section += "- Keep holiday mentions natural and wellness-focused, not forced.\n"
    
    # Build user message for schedule generation
    user_message = f"""Generate a monthly posting schedule for {request.start_date} to {end_date}.

Requirements:
- {request.posts_per_week} posts per week ({total_posts} posts total for the month)
- Platforms: {', '.join(request.platforms)}
- Content mix: 60-70% pure value, 20-30% value + product, <10% direct CTA
- Create 3-5 recurring series (e.g., "Energy Tip Tuesday", "Evening Reset Routines", "My 40+ Wellness Check-in")
{holiday_section}
- Each post must include:
  - Hook (1-3 seconds, MUST grab attention immediately or viewers scroll - use pain points)
  - Full script (15-45 seconds, following structure: Hook → Context/Empathy → Value Steps → Soft CTA)
    * Include on-screen text suggestions (especially for first 3 seconds with main keyword)
    * Main keyword must be spoken near the start
  - Caption with TikTok SEO:
    * Hook (first line)
    * Body (1-3 sentences)
    * Soft CTA (e.g., "link's in my bio if you're curious")
    * Hashtags: 1-2 specific + 1-2 broad (3-5 total)
    * Health disclaimer at end
  - Shot plan (3-6 shots, clear visual descriptions for stock video search - MUST EXCLUDE people, faces, and human subjects)
  - Suggested keywords for TikTok SEO:
    * Main keyword phrase (for on-screen text, spoken audio, caption)
    * Additional keywords for hashtags
  - Content pillar assignment (education, routine, story, product_integration)
  - Series name if part of a recurring series (create 3-5 series like "Energy Tip Tuesday", "Evening Reset Routines")

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
- shot_plan: array of {{"description": "...", "duration_seconds": N}} objects (descriptions must EXCLUDE people, faces, and human subjects)
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
    Build system message with quotes, using the same TikTok playbook best practices.
    This is used for regenerating post text while maintaining TikTok optimization.
    """
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
  - Hook (1-3 seconds, MUST grab attention immediately or viewers scroll - use pain points)
  - Full script (15-45 seconds, following structure: Hook → Context/Empathy → Value Steps → Soft CTA)
    * Include on-screen text suggestions (especially for first 3 seconds with main keyword)
    * Main keyword must be spoken near the start
  - Caption with TikTok SEO:
    * Hook (first line, attention-grabbing)
    * Body (1-3 sentences explaining value)
    * Soft CTA (e.g., "link's in my bio if you're curious")
    * Hashtags: 1-2 specific + 1-2 broad (3-5 total)
    * Health disclaimer at end
  - Shot plan (3-6 shots, clear visual descriptions optimized for stock video/image search)
    * ALIGN WITH UNICITY WELLNESS THEMES: Include wellness, healthy lifestyle, metabolic health keywords
    * Each description: 4-6 specific keywords including wellness/healthy terms
    * Examples: "healthy breakfast bowl colorful fresh ingredients morning light", "peaceful nature scene forest path wellness"
    * CRITICAL: MUST EXCLUDE people, faces, and human subjects (HEADLESS ACCOUNT)
    * Focus on: healthy meals, fresh ingredients, wellness objects, peaceful environments, nature, routine objects, products
  - Suggested keywords for TikTok SEO:
    * Main keyword phrase (for on-screen text, spoken audio, caption)
    * Additional keywords for hashtags
  - Content pillar assignment (education, routine, story, product_integration)
  - Series name if part of a recurring series (create 2-3 series like "Energy Tip Tuesday", "Evening Reset Routines")
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
- shot_plan: array of {{"description": "...", "duration_seconds": N}} objects (descriptions must EXCLUDE people, faces, and human subjects)
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

