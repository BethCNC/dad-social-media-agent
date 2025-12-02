"""Video rendering API routes."""
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.models.video import VideoRenderRequest, RenderJob
from app.models.bank import BatchJob, BatchJobBase, BatchRenderRequest
from app.services.video_service import render_video, check_render_status
from app.services.render_from_bank_service import render_video_from_bank_item
from app.database.database import get_db
from app.services.bank_service import (
    create_batch_job,
    update_batch_job_status,
    get_batch_job,
    list_bank_items,
)
from app.models.bank import BankItemFilters

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


@router.post("/render-from-bank/{item_id}", response_model=RenderJob)
async def render_from_bank(
    item_id: int,
    template_type: str = "video",
    db: Session = Depends(get_db),
) -> RenderJob:
    """Render a video from a content bank item.

    This endpoint:
    1. Loads the bank item (must be approved)
    2. Ensures voiceover exists (generates if missing)
    3. Selects/reuses visuals from Pexels
    4. Renders via Creatomate with voiceover
    5. Updates bank item with rendered_video_url

    Args:
        item_id: Content bank item ID
        template_type: "image" or "video" (default: "video")
        db: Database session

    Returns:
        RenderJob with status and video_url if successful
    """
    try:
        video_url = await render_video_from_bank_item(db, item_id, template_type=template_type)
        
        if not video_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to render video. Check logs for details."
            )
        
        return RenderJob(
            job_id=str(item_id),  # Use item_id as job identifier
            status="succeeded",
            video_url=video_url,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to render video from bank item: {str(e)}"
        ) from e


@router.post("/batch-render", response_model=BatchJob, status_code=202)
async def batch_render_videos(
    request: BatchRenderRequest,
    db: Session = Depends(get_db),
) -> BatchJob:
    """Queue a batch video rendering job.

    This endpoint accepts either:
    - A list of content bank item IDs to render
    - A filter query to find items to render (e.g., "all approved, not yet rendered")

    The actual rendering happens asynchronously (poll /batch-jobs/{id} for status).

    Args:
        request: Batch render request with content_ids or filter_criteria
        db: Database session

    Returns:
        BatchJob with job ID and initial status
    """
    payload = request.model_dump()
    
    # Resolve content IDs from request
    content_ids = []
    
    if request.content_ids:
        # Use provided IDs
        content_ids = request.content_ids
    elif request.filter_criteria:
        # Query bank items based on filter
        filters = BankItemFilters(
            status=request.filter_criteria.get("status", "approved"),
            content_pillar=request.filter_criteria.get("content_pillar"),
            limit=request.filter_criteria.get("limit", 50),
        )
        items = list_bank_items(db, filters)
        content_ids = [item.id for item in items]
        
        # Apply additional filters
        if request.filter_criteria.get("not_rendered", False):
            content_ids = [
                item.id for item in items
                if not item.rendered_video_url
            ]
    
    if not content_ids:
        raise HTTPException(
            status_code=400,
            detail="No content items found to render. Check your filter criteria or content_ids."
        )
    
    # Create batch job
    job_model = BatchJobBase(
        type="video_render",
        payload_json={
            **payload,
            "resolved_content_ids": content_ids,
            "total_count": len(content_ids),
        },
        status="pending",  # Worker will change to "running"
        progress=0,
    )
    job = create_batch_job(db, job_model)
    
    # For now, we return the job immediately. A background worker would process it.
    # In production, you'd use Celery, a queue, or a simple worker script.
    
    return job
