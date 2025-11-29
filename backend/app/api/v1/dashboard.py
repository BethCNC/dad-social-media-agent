"""Dashboard API endpoints for daily briefing."""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import date
from typing import Optional
from sqlalchemy.orm import Session

from app.services.dashboard_service import get_daily_briefing
from app.services.trend_analytics_service import analyze_trend_pulse
from app.database.database import get_db

router = APIRouter()


@router.get("/briefing")
async def get_briefing(
    target_date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format (defaults to today)"),
    db: Session = Depends(get_db)
):
    """
    Get daily briefing for Myles Hub.
    
    Returns aggregated context:
    - Greeting with current date
    - Daily content theme
    - Suggested action
    - Upcoming holidays
    - Trend alert
    
    Args:
        target_date: Optional date string in YYYY-MM-DD format
        db: Database session
        
    Returns:
        Dictionary with briefing data
    """
    try:
        # Parse target_date if provided
        parsed_date = None
        if target_date:
            try:
                parsed_date = date.fromisoformat(target_date)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid date format. Use YYYY-MM-DD."
                )
        
        briefing = await get_daily_briefing(target_date=parsed_date, db=db)
        return briefing
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate daily briefing: {str(e)}"
        ) from e


@router.get("/trends-pulse")
async def get_trends_pulse(
    db: Session = Depends(get_db)
):
    """
    Get social trends pulse data for the Trends Pulse dashboard.
    
    Returns aggregated trend metrics from Apify data:
    - New viral trends count
    - Rising templates count
    - Breakout shorts count
    - Highest velocity trends list
    
    Returns:
        Dictionary with trend pulse data
    """
    try:
        pulse_data = analyze_trend_pulse(
            hashtags=["feelgreatsystem", "unicity", "insulinresistance"],
            max_results=15
        )
        return pulse_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve trends pulse: {str(e)}"
        ) from e

