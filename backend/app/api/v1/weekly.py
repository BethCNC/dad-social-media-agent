"""Weekly schedule API endpoints."""
import logging
from datetime import date
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import ScheduledPost as ScheduledPostDB
from app.database.content_repository import get_quotes_by_category
from app.models.weekly_schedule import WeeklyScheduleRequest, WeeklySchedule, WeeklyPost
from app.services.weekly_schedule_service import create_weekly_schedule, get_weekly_schedule, auto_render_post_preview
from app.services.gemini_client import generate_content_plan_gemini
from app.models.content import ContentBrief, ShotInstruction

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate", response_model=WeeklySchedule)
async def generate_week(
    request: WeeklyScheduleRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> WeeklySchedule:
    """
    Generate a weekly schedule with 7 posts.
    
    Returns a complete weekly schedule with AI-generated content for each day.
    Automatically renders previews in the background for all posts.
    """
    try:
        schedule = await create_weekly_schedule(request, db)
        
        # Start background task to render previews for all posts
        async def render_all_previews():
            """Render previews for all posts and update database."""
            from app.database.database import SessionLocal
            
            local_db = SessionLocal()
            try:
                for post in schedule.posts:
                    try:
                        logger.info(f"🎬 Starting auto-render for post {post.id}: {post.topic}")
                        media_url = await auto_render_post_preview(post, local_db)
                        if media_url:
                            # Update post in database
                            post_db = local_db.query(ScheduledPostDB).filter(ScheduledPostDB.id == post.id).first()
                            if post_db:
                                post_db.media_url = media_url
                                local_db.commit()
                                logger.info(f"✅ Updated post {post.id} with preview URL: {media_url[:50]}...")
                            else:
                                logger.warning(f"⚠️ Post {post.id} not found in database")
                        else:
                            logger.warning(f"⚠️ Preview render returned no URL for post {post.id}")
                    except Exception as e:
                        logger.error(f"❌ Failed to render preview for post {post.id}: {type(e).__name__}: {e}", exc_info=True)
                        local_db.rollback()
            finally:
                local_db.close()
        
        # Add background task (FastAPI BackgroundTasks supports async functions)
        background_tasks.add_task(render_all_previews)
        logger.info(f"📋 Added background task to render {len(schedule.posts)} post previews")
        
        return schedule
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


@router.get("/debug/creatomate-config")
async def debug_creatomate_config():
    """
    Debug endpoint to check Creatomate configuration.
    Returns template IDs and API key status (without exposing full keys).
    """
    from app.core.config import get_settings
    settings = get_settings()
    
    return {
        "creatomate_api_key_set": bool(settings.CREATOMATE_API_KEY),
        "creatomate_api_key_length": len(settings.CREATOMATE_API_KEY) if settings.CREATOMATE_API_KEY else 0,
        "video_template_id": settings.CREATOMATE_VIDEO_TEMPLATE_ID,
        "image_template_id": settings.CREATOMATE_IMAGE_TEMPLATE_ID,
        "video_template_id_set": bool(settings.CREATOMATE_VIDEO_TEMPLATE_ID),
        "image_template_id_set": bool(settings.CREATOMATE_IMAGE_TEMPLATE_ID),
    }


@router.post("/posts/{post_id}/render-preview", response_model=WeeklyPost)
async def render_post_preview(
    post_id: int,
    db: Session = Depends(get_db)
) -> WeeklyPost:
    """
    Manually trigger preview rendering for a specific post.
    
    This endpoint can be called to render a preview if it wasn't auto-generated
    or to re-render with different assets.
    """
    try:
        post_db = db.query(ScheduledPostDB).filter(ScheduledPostDB.id == post_id).first()
        
        if not post_db:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Convert to WeeklyPost
        from app.models.content import ShotInstruction
        shot_plan = [
            ShotInstruction(**shot) for shot in (post_db.shot_plan or [])
        ]
        
        post = WeeklyPost(
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
        
        # Render preview
        logger.info(f"Manually rendering preview for post {post_id}")
        media_url = await auto_render_post_preview(post, db)
        
        if media_url:
            post_db.media_url = media_url
            post.media_url = media_url
            db.commit()
            logger.info(f"Successfully rendered preview for post {post_id}")
        else:
            logger.warning(f"Preview rendering returned no URL for post {post_id}")
        
        return post
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error rendering preview: {type(e).__name__}: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to render preview: {str(e)}"
        ) from e


@router.get("/posts/{post_id}", response_model=WeeklyPost)
async def get_post(
    post_id: int,
    db: Session = Depends(get_db)
) -> WeeklyPost:
    """
    Get a single post by ID.
    """
    try:
        post_db = db.query(ScheduledPostDB).filter(ScheduledPostDB.id == post_id).first()
        
        if not post_db:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Convert to WeeklyPost
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
        logger.error(f"API error getting post: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve post. Please try again."
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
        
        # Generate new content using Gemini with quotes
        from app.services.gemini_client import build_system_message_with_quotes, load_client_profile, client
        from google.genai import types
        import json
        
        client_profile = load_client_profile()
        system_message = build_system_message_with_quotes(client_profile, quotes)
        
        # Use the existing hook as context
        user_message = f"""Regenerate the script and caption for this post while maintaining the hook and topic:

Topic: {post_db.topic}
Hook: {post_db.hook}
Content Pillar: {post_db.content_pillar}
Template Type: {post_db.template_type}

Generate:
1. A new script (15-45 seconds) following TikTok structure: Hook (1-3s) → Context/Empathy → Value Steps → Soft CTA
   - Include on-screen text suggestions (especially first 3 seconds with main keyword)
   - Ensure main keyword is spoken near the start
2. A new caption with:
   - Hook (first line, attention-grabbing)
   - Body (1-3 sentences)
   - Soft CTA (e.g., "link's in my bio if you're curious")
   - Hashtags: 1-2 specific + 1-2 broad (3-5 total)
   - Health disclaimer at end
3. Keep the same shot_plan structure (you can adjust descriptions if needed, but MUST EXCLUDE people, faces, and human subjects)
4. Include suggested keywords for TikTok SEO (main keyword phrase + hashtag keywords)

Use the Unicity quotes provided in the system message as inspiration for authentic language."""
        
        full_prompt = f"{system_message}\n\n{user_message}"
        
        response = client.models.generate_content(
            model="gemini-3-pro-preview",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.7,
            )
        )
        
        content = response.text
        if not content:
            raise ValueError("Empty response from Gemini")
        
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

