"""Weekly schedule generation service."""
import logging
from datetime import date, timedelta
from typing import Dict
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.content_repository import get_all_quotes
from app.database.models import WeeklySchedule as WeeklyScheduleDB, ScheduledPost as ScheduledPostDB
from app.models.weekly_schedule import WeeklyScheduleRequest, WeeklyPost, WeeklySchedule
from app.services.openai_client import generate_weekly_schedule

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
            )
            db.add(post_db)
        
        db.commit()
        db.refresh(schedule_db)
        
        # Add IDs to posts
        for i, post in enumerate(weekly_posts):
            post.id = schedule_db.posts[i].id
        
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

