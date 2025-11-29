"""Content generation service."""
import logging
from datetime import date
from typing import Optional
from fastapi import HTTPException
from app.models.content import ContentBrief, GeneratedPlan
from app.services.gemini_client import generate_content_plan_gemini
from app.services.holiday_service import get_holiday_context_for_date, get_holidays_on_date, get_upcoming_holidays

logger = logging.getLogger(__name__)


async def create_content_plan(brief: ContentBrief) -> GeneratedPlan:
    """
    Create content plan from brief.
    
    Args:
        brief: Content brief (supports manual/auto mode with holiday integration)
        
    Returns:
        GeneratedPlan with script, caption, and shot plan
        
    Raises:
        HTTPException: If content generation fails
    """
    try:
        # Handle backward compatibility: if idea is provided but user_topic is not, use idea
        if not brief.user_topic and brief.idea:
            brief.user_topic = brief.idea
        
        # Determine target date for holiday context
        target_date = date.today()
        if brief.target_date:
            try:
                target_date = date.fromisoformat(brief.target_date)
            except ValueError:
                logger.warning(f"Invalid target_date format: {brief.target_date}, using today")
                target_date = date.today()
        
        # Fetch holiday context if needed
        holiday_context = None
        if brief.mode == "auto" and brief.use_holidays:
            # For auto mode with holidays, get upcoming marketing-relevant holidays
            try:
                upcoming = get_upcoming_holidays(days=14)
                marketing_relevant = [h for h in upcoming if h.is_marketing_relevant]
                
                # If a specific holiday is selected, prioritize it
                if brief.selected_holiday_id:
                    selected = [h for h in marketing_relevant if h.id == brief.selected_holiday_id]
                    if selected:
                        marketing_relevant = selected + [h for h in marketing_relevant if h.id != brief.selected_holiday_id]
                
                holiday_context = {
                    "holidays_on_date": [],
                    "upcoming_holidays": [{"name": h.name, "date": str(h.date)} for h in marketing_relevant[:3]],
                    "marketing_relevant_holidays": [{"name": h.name, "date": str(h.date)} for h in marketing_relevant[:3]],
                }
            except Exception as e:
                logger.warning(f"Failed to fetch holiday context: {e}, continuing without holidays")
        elif brief.mode == "manual" and brief.target_date:
            # For manual mode, still include holiday context if target date is specified
            try:
                context = get_holiday_context_for_date(target_date, window_days=7)
                holiday_context = {
                    "holidays_on_date": [{"name": h.name, "date": str(h.date)} for h in context.holidays_on_date],
                    "upcoming_holidays": [{"name": h.name, "date": str(h.date)} for h in context.upcoming_holidays],
                    "marketing_relevant_holidays": [{"name": h.name, "date": str(h.date)} for h in context.marketing_relevant_holidays],
                }
            except Exception as e:
                logger.warning(f"Failed to fetch holiday context for date: {e}, continuing without holidays")
        
        return await generate_content_plan_gemini(brief, holiday_context=holiday_context)
    except ValueError as e:
        logger.error(f"Content generation validation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your content plan. Please try again with a different idea."
        ) from e
    except FileNotFoundError as e:
        logger.error(f"Client profile not found: {e}")
        raise HTTPException(
            status_code=500,
            detail="Configuration error. Please contact support."
        ) from e
    except Exception as e:
        logger.error(f"Content generation error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your content plan right now. Please try again in a few minutes."
        ) from e

