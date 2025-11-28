"""Video rendering service."""
import logging
from app.models.video import VideoRenderRequest, RenderJob
from app.services.creatomate_client import start_render, get_render_status

logger = logging.getLogger(__name__)


async def render_video(request: VideoRenderRequest) -> RenderJob:
    """
    Start video rendering.
    
    Args:
        request: Video render request
        
    Returns:
        RenderJob with job_id and initial status
        
    Raises:
        HTTPException: If rendering fails
    """
    try:
        return await start_render(request)
    except Exception as e:
        logger.error(f"Video rendering error: {type(e).__name__}: {e}")
        raise


async def check_render_status(job_id: str) -> RenderJob:
    """
    Check video rendering status.
    
    Args:
        job_id: Render job ID
        
    Returns:
        RenderJob with current status
        
    Raises:
        HTTPException: If status check fails
    """
    try:
        return await get_render_status(job_id)
    except Exception as e:
        logger.error(f"Render status check error: {type(e).__name__}: {e}")
        raise

