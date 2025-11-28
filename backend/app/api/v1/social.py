"""Social media scheduling API routes."""
from fastapi import APIRouter, HTTPException
from app.models.social import ScheduleRequest, ScheduleResponse
from app.services.social_service import schedule_content

router = APIRouter()


@router.post("/schedule", response_model=ScheduleResponse)
async def schedule_post(request: ScheduleRequest) -> ScheduleResponse:
    """
    Schedule social media post.
    
    Args:
        request: Schedule request with video_url, caption, platforms, and optional scheduled_time
        
    Returns:
        ScheduleResponse with provider_id, status, and external_links
    """
    try:
        return await schedule_content(request)
    except Exception as e:
        error_message = str(e) if str(e) else "We couldn't schedule this post. Please try again."
        raise HTTPException(
            status_code=500,
            detail=error_message
        ) from e
