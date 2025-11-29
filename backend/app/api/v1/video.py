"""Video rendering API routes."""
from fastapi import APIRouter, HTTPException
from app.models.video import VideoRenderRequest, RenderJob
from app.services.video_service import render_video, check_render_status

router = APIRouter()


@router.post("/render", response_model=RenderJob)
async def start_render(request: VideoRenderRequest) -> RenderJob:
    """
    Start video rendering job.
    
    Args:
        request: Video render request with assets, script, and optional title
        
    Returns:
        RenderJob with job_id and initial status
    """
    try:
        return await render_video(request)
    except Exception as e:
        error_message = str(e) if str(e) else "We couldn't start video rendering. Please try again."
        raise HTTPException(
            status_code=500,
            detail=error_message
        ) from e


@router.get("/render/{job_id}/status", response_model=RenderJob)
async def get_render_status(job_id: str) -> RenderJob:
    """
    Get status of video rendering job.
    
    Args:
        job_id: Render job ID
        
    Returns:
        RenderJob with current status and video_url if complete
    """
    try:
        return await check_render_status(job_id)
    except Exception as e:
        error_message = str(e) if str(e) else "We couldn't check render status. Please try again."
        raise HTTPException(
            status_code=500,
            detail=error_message
        ) from e


@router.post("/render/preview", response_model=RenderJob)
async def render_preview(request: VideoRenderRequest) -> RenderJob:
    """
    Render a quick preview using Creatomate template.
    Used for showing previews when user selects alternative assets.
    
    Args:
        request: Video render request with assets, script, and template_type
        
    Returns:
        RenderJob with job_id and initial status
    """
    try:
        return await render_video(request)
    except Exception as e:
        error_message = str(e) if str(e) else "We couldn't render preview. Please try again."
        raise HTTPException(
            status_code=500,
            detail=error_message
        ) from e
