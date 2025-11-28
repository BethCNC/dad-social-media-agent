"""Schedule generation API routes."""
from fastapi import APIRouter
from app.models.schedule import ScheduleRequest, MonthlySchedule
from app.services.schedule_service import create_monthly_schedule

router = APIRouter()


@router.post("/monthly", response_model=MonthlySchedule)
async def create_monthly_schedule_endpoint(request: ScheduleRequest) -> MonthlySchedule:
    """
    Generate a monthly posting schedule with full content for each day.
    
    This endpoint generates 30 days of suggested content following TikTok playbook
    best practices and Unicity compliance rules. Each day includes a full script,
    caption, shot plan, and suggested keywords.
    
    Args:
        request: ScheduleRequest with start_date, platforms, and posts_per_week
        
    Returns:
        MonthlySchedule with all items and series breakdown
        
    Raises:
        HTTPException: If schedule generation fails
    """
    return await create_monthly_schedule(request)

