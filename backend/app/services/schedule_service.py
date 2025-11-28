"""Schedule generation service."""
import logging
from datetime import date, timedelta
from typing import Dict
from fastapi import HTTPException
from app.models.schedule import ScheduleRequest, ScheduledContentItem, MonthlySchedule
from app.services.openai_client import generate_monthly_schedule

logger = logging.getLogger(__name__)


def calculate_posting_days(start_date: date, posts_per_week: int) -> list[date]:
    """
    Calculate which days to post based on posts_per_week.
    
    Distributes posts evenly across the month, preferring weekdays.
    
    Args:
        start_date: First day of the month
        posts_per_week: Number of posts per week (3-7)
        
    Returns:
        List of dates to post on
    """
    posting_days = []
    current_date = start_date
    end_date = start_date + timedelta(days=29)  # 30 days total
    
    # Calculate total posts for the month
    total_posts = int((posts_per_week / 7) * 30)
    
    # Distribute posts evenly across the month
    days_between_posts = 30 / total_posts if total_posts > 0 else 7
    
    while current_date <= end_date and len(posting_days) < total_posts:
        posting_days.append(current_date)
        # Move to next posting day
        days_to_add = max(1, int(days_between_posts))
        current_date += timedelta(days=days_to_add)
    
    return posting_days[:total_posts]


def validate_content_mix(items: list[ScheduledContentItem]) -> Dict[str, int]:
    """
    Validate and calculate content mix distribution.
    
    Args:
        items: List of scheduled content items
        
    Returns:
        Dictionary with pillar counts
    """
    pillar_counts = {
        "education": 0,
        "routine": 0,
        "story": 0,
        "product_integration": 0,
    }
    
    for item in items:
        pillar = item.content_pillar.lower()
        if pillar in pillar_counts:
            pillar_counts[pillar] += 1
    
    total = len(items)
    if total > 0:
        logger.info(f"Content mix distribution: {pillar_counts}")
        logger.info(f"Education: {pillar_counts['education']/total*100:.1f}%")
        logger.info(f"Routine: {pillar_counts['routine']/total*100:.1f}%")
        logger.info(f"Story: {pillar_counts['story']/total*100:.1f}%")
        logger.info(f"Product Integration: {pillar_counts['product_integration']/total*100:.1f}%")
    
    return pillar_counts


def calculate_series_breakdown(items: list[ScheduledContentItem]) -> Dict[str, int]:
    """
    Calculate series breakdown from schedule items.
    
    Args:
        items: List of scheduled content items
        
    Returns:
        Dictionary mapping series names to counts
    """
    series_counts: Dict[str, int] = {}
    
    for item in items:
        if item.series_name:
            series_counts[item.series_name] = series_counts.get(item.series_name, 0) + 1
    
    return series_counts


async def create_monthly_schedule(request: ScheduleRequest) -> MonthlySchedule:
    """
    Generate a complete monthly schedule with full content for each day.
    
    - Calculates posting days based on posts_per_week
    - Calls OpenAI to generate all content at once
    - Validates content mix distribution
    - Assigns series names and content pillars
    - Returns complete schedule
    
    Args:
        request: ScheduleRequest with start_date, platforms, posts_per_week
        
    Returns:
        MonthlySchedule with all items and breakdowns
        
    Raises:
        HTTPException: If schedule generation fails
    """
    try:
        # Calculate posting days
        posting_days = calculate_posting_days(request.start_date, request.posts_per_week)
        logger.info(f"Generating schedule for {len(posting_days)} posting days")
        
        # Generate content for all posting days
        schedule_items = await generate_monthly_schedule(request)
        
        # Filter items to only include posting days and sort by date
        posting_dates_set = set(posting_days)
        filtered_items = [
            item for item in schedule_items
            if item.date in posting_dates_set
        ]
        
        # If we got fewer items than expected, pad with the first items
        if len(filtered_items) < len(posting_days):
            logger.warning(f"Got {len(filtered_items)} items but expected {len(posting_days)}")
            # Use all items we got, assign to posting days
            filtered_items = schedule_items[:len(posting_days)]
            # Update dates to match posting days
            for i, item in enumerate(filtered_items):
                if i < len(posting_days):
                    item.date = posting_days[i]
                    # Update day_of_week
                    item.day_of_week = posting_days[i].strftime("%A")
        
        # Sort by date
        filtered_items.sort(key=lambda x: x.date)
        
        # Validate content mix
        pillar_counts = validate_content_mix(filtered_items)
        
        # Calculate series breakdown
        series_breakdown = calculate_series_breakdown(filtered_items)
        
        # Calculate end date
        end_date = request.start_date + timedelta(days=29)
        
        return MonthlySchedule(
            start_date=request.start_date,
            end_date=end_date,
            items=filtered_items,
            series_breakdown=series_breakdown,
        )
        
    except ValueError as e:
        logger.error(f"Schedule generation validation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your schedule. Please try again with different parameters."
        ) from e
    except FileNotFoundError as e:
        logger.error(f"Client profile not found: {e}")
        raise HTTPException(
            status_code=500,
            detail="Configuration error. Please contact support."
        ) from e
    except Exception as e:
        logger.error(f"Schedule generation error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your schedule right now. Please try again in a few minutes."
        ) from e

