"""Weekly schedule API endpoints."""
import logging
from datetime import date
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import ScheduledPost as ScheduledPostDB
from app.database.content_repository import get_quotes_by_category
from app.models.weekly_schedule import WeeklyScheduleRequest, WeeklySchedule, WeeklyPost
from app.services.weekly_schedule_service import create_weekly_schedule, get_weekly_schedule
from app.services.openai_client import generate_content_plan
from app.models.content import ContentBrief, ShotInstruction

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate", response_model=WeeklySchedule)
async def generate_week(
    request: WeeklyScheduleRequest,
    db: Session = Depends(get_db)
) -> WeeklySchedule:
    """
    Generate a weekly schedule with 7 posts.
    
    Returns a complete weekly schedule with AI-generated content for each day.
    """
    try:
        return await create_weekly_schedule(request, db)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"API error generating weekly schedule: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate weekly schedule. Please try again."
        ) from e


@router.get("/{week_date}", response_model=WeeklySchedule)
async def get_week(
    week_date: date,
    db: Session = Depends(get_db)
) -> WeeklySchedule:
    """
    Get existing weekly schedule for a given week.
    
    week_date: Any date in the week (will find Monday of that week)
    """
    try:
        return await get_weekly_schedule(week_date, db)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"API error getting weekly schedule: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve weekly schedule. Please try again."
        ) from e


@router.put("/posts/{post_id}", response_model=WeeklyPost)
async def update_post(
    post_id: int,
    post_update: WeeklyPost,
    db: Session = Depends(get_db)
) -> WeeklyPost:
    """
    Update an individual post in the weekly schedule.
    
    Allows editing of post content, media, status, etc.
    """
    try:
        post_db = db.query(ScheduledPostDB).filter(ScheduledPostDB.id == post_id).first()
        
        if not post_db:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Update fields
        if post_update.topic:
            post_db.topic = post_update.topic
        if post_update.hook:
            post_db.hook = post_update.hook
        if post_update.script:
            post_db.script = post_update.script
        if post_update.caption:
            post_db.caption = post_update.caption
        if post_update.template_type:
            post_db.template_type = post_update.template_type
        if post_update.shot_plan:
            post_db.shot_plan = [
                {"description": shot.description, "duration_seconds": shot.duration_seconds}
                for shot in post_update.shot_plan
            ]
        if post_update.suggested_keywords:
            post_db.suggested_keywords = post_update.suggested_keywords
        if post_update.status:
            post_db.status = post_update.status
        if post_update.media_url:
            post_db.media_url = post_update.media_url
        
        db.commit()
        db.refresh(post_db)
        
        # Convert back to WeeklyPost
        shot_plan = [
            ShotInstruction(**shot) for shot in (post_db.shot_plan or [])
        ]
        
        return WeeklyPost(
            id=post_db.id,
            post_date=post_db.post_date,
            post_time=post_db.post_time,
            content_pillar=post_db.content_pillar,
            series_name=post_db.series_name,
            topic=post_db.topic,
            hook=post_db.hook,
            script=post_db.script,
            caption=post_db.caption,
            template_type=post_db.template_type,
            shot_plan=shot_plan,
            suggested_keywords=post_db.suggested_keywords or [],
            status=post_db.status,
            media_url=post_db.media_url,
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"API error updating post: {type(e).__name__}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update post. Please try again."
        ) from e


@router.post("/posts/{post_id}/regenerate-text", response_model=WeeklyPost)
async def regenerate_post_text(
    post_id: int,
    db: Session = Depends(get_db)
) -> WeeklyPost:
    """
    Regenerate text content for a post using content database quotes.
    
    Maintains the original hook and structure, but refreshes script and caption
    using Unicity quotes from the content database.
    """
    try:
        post_db = db.query(ScheduledPostDB).filter(ScheduledPostDB.id == post_id).first()
        
        if not post_db:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Load relevant quotes based on content pillar and product
        quotes_db = get_quotes_by_category(
            db,
            category=post_db.content_pillar,
            limit=10
        )
        quotes = [quote.quote_text for quote in quotes_db]
        
        # Create a brief from the existing post
        brief = ContentBrief(
            idea=post_db.topic,
            platforms=["TikTok", "Instagram"],
            tone="friendly",
            template_type=post_db.template_type
        )
        
        # Generate new content using OpenAI with quotes
        from app.services.openai_client import build_system_message_with_quotes, load_client_profile
        client_profile = load_client_profile()
        system_message = build_system_message_with_quotes(client_profile, quotes)
        
        # Use the existing hook as context
        user_message = f"""Regenerate the script and caption for this post while maintaining the hook and topic:

Topic: {post_db.topic}
Hook: {post_db.hook}
Content Pillar: {post_db.content_pillar}
Template Type: {post_db.template_type}

Generate:
1. A new script (15-45 seconds) that maintains the hook but refreshes the content
2. A new caption with hook, body, CTA, hashtags, and health disclaimer
3. Keep the same shot_plan structure (you can adjust descriptions if needed)

Use the Unicity quotes provided in the system message as inspiration for authentic language."""
        
        from app.services.openai_client import client
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
        
        import json
        data = json.loads(content)
        
        # Update post with new content
        post_db.script = data.get("script", post_db.script)
        post_db.caption = data.get("caption", post_db.caption)
        
        # Update shot plan if provided
        if "shot_plan" in data:
            post_db.shot_plan = [
                {"description": shot["description"], "duration_seconds": shot["duration_seconds"]}
                for shot in data["shot_plan"]
            ]
        
        db.commit()
        db.refresh(post_db)
        
        # Convert back to WeeklyPost
        shot_plan = [
            ShotInstruction(**shot) for shot in (post_db.shot_plan or [])
        ]
        
        return WeeklyPost(
            id=post_db.id,
            post_date=post_db.post_date,
            post_time=post_db.post_time,
            content_pillar=post_db.content_pillar,
            series_name=post_db.series_name,
            topic=post_db.topic,
            hook=post_db.hook,
            script=post_db.script,
            caption=post_db.caption,
            template_type=post_db.template_type,
            shot_plan=shot_plan,
            suggested_keywords=post_db.suggested_keywords or [],
            status=post_db.status,
            media_url=post_db.media_url,
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"API error regenerating post text: {type(e).__name__}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to regenerate post text. Please try again."
        ) from e

