"""Social media scheduling service."""
import logging
from app.models.social import ScheduleRequest, ScheduleResponse
from app.services.ayrshare_client import schedule_post

logger = logging.getLogger(__name__)


def schedule_content(request: ScheduleRequest) -> ScheduleResponse:
    """
    Schedule social media content.
    
    Args:
        request: Schedule request
        
    Returns:
        ScheduleResponse with provider_id, status, and external_links
        
    Raises:
        HTTPException: If scheduling fails
    """
    try:
        return schedule_post(request)
    except Exception as e:
        logger.error(f"Social scheduling error: {type(e).__name__}: {e}")
        raise

