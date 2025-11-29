"""Weekly schedule generation service."""
import logging
import asyncio
from datetime import date, timedelta
from typing import Dict
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.content_repository import get_all_quotes
from app.database.models import WeeklySchedule as WeeklyScheduleDB, ScheduledPost as ScheduledPostDB
from app.models.weekly_schedule import WeeklyScheduleRequest, WeeklyPost, WeeklySchedule
from app.models.content import TikTokMusicHint
from app.services.gemini_client import generate_weekly_schedule
from app.services.asset_search_service import search_relevant_assets
from app.services.video_service import render_video, check_render_status
from app.models.video import VideoRenderRequest, AssetSelection
from app.services.audio_service import pick_track_for_plan

logger = logging.getLogger(__name__)


def calculate_series_breakdown(posts: list[WeeklyPost]) -> Dict[str, int]:
    """
    Calculate series breakdown from posts.
    
    Args:
        posts: List of WeeklyPost objects
        
    Returns:
        Dictionary mapping series names to counts
    """
    series_counts: Dict[str, int] = {}
    
    for post in posts:
        if post.series_name:
            series_counts[post.series_name] = series_counts.get(post.series_name, 0) + 1
    
    return series_counts


async def auto_render_post_preview(post: WeeklyPost, db: Session) -> str | None:
    """
    Automatically select assets and render a preview for a post.
    
    Args:
        post: WeeklyPost to render preview for
        db: Database session
        
    Returns:
        Media URL if successful, None if failed
    """
    try:
        # Search for relevant assets using contextual search
        logger.info(f"Searching assets for post {post.id}: {post.topic}")
        
        shot_plan_dict = [
            {"description": shot.description, "duration_seconds": shot.duration_seconds}
            for shot in post.shot_plan
        ]
        
        assets = await search_relevant_assets(
            topic=post.topic,
            hook=post.hook,
            script=post.script,
            shot_plan=shot_plan_dict,
            content_pillar=post.content_pillar,
            suggested_keywords=post.suggested_keywords or [],
            max_results=12,
            db=db
        )
        
        if not assets:
            logger.warning(f"No assets found for post {post.id}")
            return None
        
        # Always require 2 videos since we're using video template
        required_count = 2
        selected_assets = assets[:required_count]
        
        if len(selected_assets) < required_count:
            logger.warning(f"Not enough assets found for post {post.id}: need {required_count} videos, got {len(selected_assets)}")
            return None
        
        logger.info(f"Selected {len(selected_assets)} video assets for post {post.id}:")
        for i, asset in enumerate(selected_assets, 1):
            logger.info(f"   Video {i}: {asset.video_url[:80]}... (duration: {asset.duration_seconds}s)")
        
        logger.info(f"Selected {len(selected_assets)} assets for post {post.id}, rendering preview...")
        
        # Create render request - always use video template for now
        render_request = VideoRenderRequest(
            assets=[
                AssetSelection(
                    id=asset.video_url,
                    start_at=None,
                    end_at=None
                )
                for asset in selected_assets
            ],
            script=post.script,
            title=None,
            template_type="video",  # Always use video template for now
            music_url=None,  # Will be applied based on AudioMode and audio selection when scheduling full renders
        )
        
        logger.info(f"Created render request for post {post.id}: {len(selected_assets)} assets, template_type=video")
        
        # Start render
        logger.info(f"Starting Creatomate render for post {post.id}, job will be created...")
        try:
            job = await render_video(render_request)
            logger.info(f"Creatomate render job created for post {post.id}: job_id={job.job_id}, status={job.status}")
        except Exception as e:
            logger.error(f"Failed to start Creatomate render for post {post.id}: {type(e).__name__}: {e}", exc_info=True)
            return None
        
        if not job.job_id:
            logger.error(f"No job_id returned from Creatomate for post {post.id}")
            return None
        
        # Poll for completion (max 120 seconds = 2 minutes)
        max_attempts = 60
        attempts = 0
        
        logger.info(f"Polling for render completion for post {post.id}, job_id={job.job_id}")
        while attempts < max_attempts:
            await asyncio.sleep(2)  # Check every 2 seconds
            try:
                status = await check_render_status(job.job_id)
                logger.debug(f"Post {post.id} render status check {attempts+1}/{max_attempts}: status={status.status}")
                
                if status.status == "succeeded" and status.video_url:
                    logger.info(f"✅ Preview rendered successfully for post {post.id}: {status.video_url[:80]}...")
                    return status.video_url
                elif status.status in ["failed", "error"]:
                    logger.warning(f"❌ Preview render failed for post {post.id}: status={status.status}")
                    return None
                elif status.status == "pending" or status.status == "rendering":
                    # Still processing, continue polling
                    pass
            except Exception as e:
                logger.error(f"Error checking render status for post {post.id}: {type(e).__name__}: {e}")
                # Continue polling despite error
            
            attempts += 1
        
        logger.warning(f"⏱️ Preview render timeout for post {post.id} after {max_attempts * 2} seconds")
        return None
        
    except Exception as e:
        logger.error(f"Error auto-rendering preview for post {post.id}: {type(e).__name__}: {e}")
        return None


async def create_weekly_schedule(
    request: WeeklyScheduleRequest,
    db: Session
) -> WeeklySchedule:
    """
    Generate a complete weekly schedule with 7 posts and save to database.
    
    - Loads content database quotes
    - Calls OpenAI with content database context
    - AI decides image vs video for each post
    - Saves to database
    - Returns complete schedule
    
    Args:
        request: WeeklyScheduleRequest with week_start_date and platforms
        db: Database session
        
    Returns:
        WeeklySchedule with all posts and breakdowns
        
    Raises:
        HTTPException: If schedule generation fails
    """
    try:
        # Ensure week_start_date is Monday
        week_start = request.week_start_date
        days_since_monday = week_start.weekday()
        if days_since_monday != 0:
            week_start = week_start - timedelta(days=days_since_monday)
        
        week_end = week_start + timedelta(days=6)
        
        # Check if schedule already exists for this week
        existing_schedule = (
            db.query(WeeklyScheduleDB)
            .filter(WeeklyScheduleDB.week_start_date == week_start)
            .first()
        )
        
        if existing_schedule:
            # Load existing schedule
            posts_db = (
                db.query(ScheduledPostDB)
                .filter(ScheduledPostDB.schedule_id == existing_schedule.id)
                .order_by(ScheduledPostDB.post_date)
                .all()
            )
            
            posts = []
            for post_db in posts_db:
                from app.models.content import ShotInstruction
                shot_plan = [
                    ShotInstruction(**shot) for shot in (post_db.shot_plan or [])
                ]

                # Parse TikTok music hints from JSON if present
                raw_hints = post_db.tiktok_music_hints or []
                tiktok_hints: list[TikTokMusicHint] = []
                for hint in raw_hints:
                    try:
                        if isinstance(hint, dict):
                            tiktok_hints.append(TikTokMusicHint(**hint))
                    except Exception as e:
                        logger.warning(f"Skipping invalid TikTokMusicHint from DB: {hint} ({e})")

                posts.append(WeeklyPost(
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
                    audio_track_id=post_db.audio_track_id,
                    audio_track_title=None,  # Title not stored separately; can be filled later if needed
                    audio_music_mood=post_db.audio_music_mood,
                    tiktok_music_hints=tiktok_hints,
                ))
            
            series_breakdown = calculate_series_breakdown(posts)
            
            return WeeklySchedule(
                id=existing_schedule.id,
                week_start_date=week_start,
                week_end_date=week_end,
                posts=posts,
                series_breakdown=series_breakdown,
                status=existing_schedule.status,
            )
        
        # Load quotes from content database
        quotes_db = get_all_quotes(db, limit=20)
        quotes = [quote.quote_text for quote in quotes_db]
        
        logger.info(f"Generating weekly schedule for {week_start} to {week_end} with {len(quotes)} quotes")
        
        # Generate posts using OpenAI
        weekly_posts = await generate_weekly_schedule(request, quotes=quotes)
        
        # Calculate series breakdown
        series_breakdown = calculate_series_breakdown(weekly_posts)
        
        # Save to database
        schedule_db = WeeklyScheduleDB(
            week_start_date=week_start,
            status="draft"
        )
        db.add(schedule_db)
        db.flush()  # Get the ID
        
        for post in weekly_posts:
            from app.models.content import ShotInstruction
            shot_plan_json = [
                {"description": shot.description, "duration_seconds": shot.duration_seconds}
                for shot in post.shot_plan
            ]

            # Infer music mood heuristically if not provided (education/story → energetic, routine → calm, product → inspirational)
            inferred_mood = None
            if hasattr(post, "audio_music_mood") and post.audio_music_mood:
                inferred_mood = post.audio_music_mood
            else:
                pillar = (post.content_pillar or "").lower()
                if pillar in ["routine"]:
                    inferred_mood = "calm"
                elif pillar in ["story", "education"]:
                    inferred_mood = "energetic"
                elif pillar in ["product_integration"]:
                    inferred_mood = "inspirational"

            # For now, estimate video length as 30 seconds
            estimated_length_seconds = 30

            audio_track = None
            try:
                audio_track = pick_track_for_plan(
                    music_mood=inferred_mood,
                    estimated_length_seconds=estimated_length_seconds,
                    db=db,
                )
            except Exception as e:
                logger.warning(f"Failed to select audio track for post '{post.topic}': {e}")

            audio_track_id = audio_track.id if audio_track else None
            audio_music_mood = audio_track.mood if audio_track else inferred_mood
            
            post_db = ScheduledPostDB(
                schedule_id=schedule_db.id,
                post_date=post.post_date,
                post_time=post.post_time,
                content_pillar=post.content_pillar,
                series_name=post.series_name,
                topic=post.topic,
                hook=post.hook,
                script=post.script,
                caption=post.caption,
                template_type=post.template_type,
                shot_plan=shot_plan_json,
                suggested_keywords=post.suggested_keywords,
                status=post.status,
                audio_track_id=audio_track_id,
                audio_music_mood=audio_music_mood,
                tiktok_music_hints=[hint.model_dump() for hint in getattr(post, "tiktok_music_hints", [])],
            )
            db.add(post_db)
        
        db.commit()
        db.refresh(schedule_db)
        
        # Add IDs to posts
        for i, post in enumerate(weekly_posts):
            post.id = schedule_db.posts[i].id
        
        # Auto-render previews for all posts (in background, don't block)
        logger.info(f"Starting auto-render of previews for {len(weekly_posts)} posts...")
        
        # Note: Preview rendering will happen in background via API endpoint
        # The frontend can trigger rendering, or we can add a background task endpoint
        
        return WeeklySchedule(
            id=schedule_db.id,
            week_start_date=week_start,
            week_end_date=week_end,
            posts=weekly_posts,
            series_breakdown=series_breakdown,
            status=schedule_db.status,
        )
        
    except ValueError as e:
        logger.error(f"Weekly schedule generation validation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your weekly schedule. Please try again with different parameters."
        ) from e
    except FileNotFoundError as e:
        logger.error(f"Client profile not found: {e}")
        raise HTTPException(
            status_code=500,
            detail="Configuration error. Please contact support."
        ) from e
    except Exception as e:
        logger.error(f"Weekly schedule generation error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your weekly schedule right now. Please try again in a few minutes."
        ) from e


async def get_weekly_schedule(
    week_start_date: date,
    db: Session
) -> WeeklySchedule:
    """
    Get existing weekly schedule from database.
    
    Args:
        week_start_date: Monday of the week
        db: Database session
        
    Returns:
        WeeklySchedule if found
        
    Raises:
        HTTPException: If schedule not found
    """
    # Ensure it's Monday
    days_since_monday = week_start_date.weekday()
    if days_since_monday != 0:
        week_start_date = week_start_date - timedelta(days=days_since_monday)
    
    schedule_db = (
        db.query(WeeklyScheduleDB)
        .filter(WeeklyScheduleDB.week_start_date == week_start_date)
        .first()
    )
    
    if not schedule_db:
        raise HTTPException(
            status_code=404,
            detail=f"No schedule found for week starting {week_start_date}"
        )
    
    posts_db = (
        db.query(ScheduledPostDB)
        .filter(ScheduledPostDB.schedule_id == schedule_db.id)
        .order_by(ScheduledPostDB.post_date)
        .all()
    )
    
    posts = []
    for post_db in posts_db:
        from app.models.content import ShotInstruction
        shot_plan = [
            ShotInstruction(**shot) for shot in (post_db.shot_plan or [])
        ]
        
        posts.append(WeeklyPost(
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
        ))
    
    series_breakdown = calculate_series_breakdown(posts)
    week_end = week_start_date + timedelta(days=6)
    
    return WeeklySchedule(
        id=schedule_db.id,
        week_start_date=week_start_date,
        week_end_date=week_end,
        posts=posts,
        series_breakdown=series_breakdown,
        status=schedule_db.status,
    )

