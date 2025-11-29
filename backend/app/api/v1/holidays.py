"""Holiday API routes."""
from fastapi import APIRouter, HTTPException, Query
from datetime import date
from typing import List
from app.models.holiday import Holiday, HolidayContext
from app.services.holiday_service import (
    get_upcoming_holidays,
    get_holidays_on_date,
    get_holiday_context_for_date,
    sync_us_holidays,
)

router = APIRouter()


@router.get("/upcoming", response_model=List[Holiday])
async def get_upcoming(
    days: int = Query(30, ge=1, le=365, description="Number of days to look ahead")
) -> List[Holiday]:
    """
    Get upcoming holidays within the specified number of days.
    
    Args:
        days: Number of days to look ahead (1-365)
        
    Returns:
        List of upcoming holidays
    """
    try:
        return get_upcoming_holidays(days=days)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch upcoming holidays: {str(e)}"
        )


@router.get("/on-date", response_model=List[Holiday])
async def get_on_date(
    date_str: str = Query(..., description="Date in YYYY-MM-DD format")
) -> List[Holiday]:
    """
    Get all holidays on a specific date.
    
    Args:
        date_str: Date in YYYY-MM-DD format
        
    Returns:
        List of holidays on that date
    """
    try:
        target_date = date.fromisoformat(date_str)
        return get_holidays_on_date(target_date)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch holidays: {str(e)}"
        )


@router.get("/context", response_model=HolidayContext)
async def get_context(
    date_str: str = Query(..., description="Date in YYYY-MM-DD format"),
    window_days: int = Query(7, ge=1, le=30, description="Number of days to look ahead for upcoming holidays")
) -> HolidayContext:
    """
    Get holiday context for a specific date, including holidays on that date
    and upcoming holidays within the window.
    
    Args:
        date_str: Date in YYYY-MM-DD format
        window_days: Number of days to look ahead (1-30)
        
    Returns:
        HolidayContext with holidays on date and upcoming holidays
    """
    try:
        target_date = date.fromisoformat(date_str)
        return get_holiday_context_for_date(target_date, window_days=window_days)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch holiday context: {str(e)}"
        )


@router.post("/sync")
async def sync_holidays() -> dict:
    """
    Manually trigger a sync of US holidays from Google Calendar.
    
    This endpoint fetches holidays from the ICS feed and updates the database.
    It can be called periodically (e.g., via cron) to keep holidays up to date.
    
    Returns:
        Dictionary with sync status and count
    """
    try:
        count = sync_us_holidays()
        return {
            "status": "success",
            "holidays_synced": count,
            "message": f"Successfully synced {count} holidays"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync holidays: {str(e)}"
        )

