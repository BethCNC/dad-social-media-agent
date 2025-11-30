"""Asset search API routes."""
from fastapi import APIRouter, HTTPException, Query, Body, UploadFile, File, Depends
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.video import AssetResult
from app.services.gemini_client import generate_image_asset
from app.services.asset_search_service import generate_relevant_assets, search_relevant_assets
from app.database.database import get_db
from app.database.models import UserVideo
from app.core.config import get_settings
from pathlib import Path
import uuid
import shutil
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()

# Ensure upload directory exists
UPLOAD_DIR = settings.UPLOAD_DIR
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ContextualSearchRequest(BaseModel):
    """Request for context-aware asset search."""
    topic: str
    hook: str
    script: str
    shot_plan: List[dict]  # List of {"description": str, "duration_seconds": int}
    content_pillar: str
    suggested_keywords: Optional[List[str]] = None
    max_results: int = 12
    visual_style: str = "ai_generation"  # 'pexels' for stock videos, 'ai_generation' for AI images


@router.get("/search", response_model=list[AssetResult])
async def search_assets(
    query: str = Query(..., description="Image generation prompt"),
    max_results: int = Query(10, ge=1, le=80, description="Maximum number of results")
) -> list[AssetResult]:
    """
    Generate AI images using Nano Banana Pro (backward compatible endpoint).
    
    Args:
        query: Image generation prompt string
        max_results: Maximum number of results (1-80)
        
    Returns:
        List of AssetResult objects with generated image URLs
    """
    try:
        import uuid
        from app.models.video import AssetResult
        
        # Generate a single image for the query
        image_url = await generate_image_asset(query)
        
        # Create AssetResult object
        # image_url is already absolute (from generate_image_asset)
        asset = AssetResult(
            id=image_url,  # Use image URL as ID (Creatomate expects URL in asset.id)
            thumbnail_url=image_url,
            video_url=image_url,
            duration_seconds=10  # Default duration for static images
        )
        
        # Return list with single result (or duplicate for max_results > 1 if needed)
        return [asset] * min(max_results, 1)
    except Exception as e:
        error_message = str(e) if str(e) else "We couldn't generate images. Please try again."
        raise HTTPException(
            status_code=500,
            detail=error_message
        ) from e


@router.post("/search/contextual", response_model=list[AssetResult])
async def search_assets_contextual(
    request: ContextualSearchRequest = Body(...),
    db: Session = Depends(get_db)
) -> list[AssetResult]:
    """
    Context-aware search for stock video assets using post content.
    
    Uses topic, hook, script, shot plan, content pillar, and suggested keywords
    to find the most relevant assets through multiple search strategies.
    
    Args:
        request: ContextualSearchRequest with post content details
        
    Returns:
        List of AssetResult objects, sorted by relevance
    """
    try:
        # Map visual_style to mode parameter
        mode = "pexels" if request.visual_style == "pexels" else "ai_generation"
        
        return await search_relevant_assets(
            topic=request.topic,
            hook=request.hook,
            script=request.script,
            shot_plan=request.shot_plan,
            content_pillar=request.content_pillar,
            suggested_keywords=request.suggested_keywords,
            max_results=request.max_results,
            db=db,
            mode=mode
        )
    except Exception as e:
        error_message = str(e) if str(e) else "We couldn't search for videos. Please try again."
        raise HTTPException(
            status_code=500,
            detail=error_message
        ) from e


@router.post("/upload", response_model=dict)
async def upload_video(
    file: UploadFile = File(...),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    description: Optional[str] = Query(None, description="Video description"),
    db: Session = Depends(get_db)
) -> dict:
    """
    Upload a user video file for use as B-roll/background footage.
    
    Args:
        file: Video file to upload
        tags: Optional comma-separated tags for searchability
        description: Optional description
        db: Database session
        
    Returns:
        Dict with video ID and URL
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith('video/'):
        raise HTTPException(
            status_code=400,
            detail="File must be a video. Supported formats: MP4, MOV, AVI, etc."
        )
    
    file_path = None
    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix if file.filename else '.mp4'
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create relative URL for serving
        video_url = f"/api/assets/videos/{unique_filename}"
        
        # Parse tags
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        # Create database record
        user_video = UserVideo(
            filename=unique_filename,
            original_filename=file.filename or "uploaded_video",
            video_url=video_url,
            tags=tag_list,
            description=description,
            file_size=file_path.stat().st_size
        )
        
        db.add(user_video)
        db.commit()
        db.refresh(user_video)
        
        logger.info(f"Uploaded user video: {user_video.id} - {unique_filename}")
        
        return {
            "id": str(user_video.id),
            "video_url": video_url,
            "filename": unique_filename,
            "original_filename": user_video.original_filename
        }
        
    except Exception as e:
        logger.error(f"Error uploading video: {type(e).__name__}: {e}")
        # Clean up file if database save failed
        if file_path and file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload video: {str(e)}"
        ) from e


@router.get("/videos", response_model=List[dict])
async def list_user_videos(
    db: Session = Depends(get_db)
) -> List[dict]:
    """
    List all user-uploaded videos.
    
    Returns:
        List of user video objects
    """
    videos = db.query(UserVideo).order_by(UserVideo.created_at.desc()).all()
    
    return [
        {
            "id": str(video.id),
            "filename": video.filename,
            "original_filename": video.original_filename,
            "video_url": video.video_url,
            "thumbnail_url": video.thumbnail_url,
            "duration_seconds": video.duration_seconds,
            "tags": video.tags or [],
            "description": video.description,
            "use_count": video.use_count,
            "last_used_at": video.last_used_at.isoformat() if video.last_used_at else None,
            "created_at": video.created_at.isoformat()
        }
        for video in videos
    ]


@router.delete("/videos/{video_id}")
async def delete_user_video(
    video_id: int,
    db: Session = Depends(get_db)
) -> dict:
    """
    Delete a user-uploaded video.
    
    Args:
        video_id: ID of video to delete
        db: Database session
        
    Returns:
        Success message
    """
    video = db.query(UserVideo).filter(UserVideo.id == video_id).first()
    
    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )
    
    # Delete file
    file_path = UPLOAD_DIR / video.filename
    if file_path.exists():
        file_path.unlink()
    
    # Delete database record
    db.delete(video)
    db.commit()
    
    return {"message": "Video deleted successfully"}


@router.get("/videos/{filename}")
@router.head("/videos/{filename}")
async def serve_video(filename: str):
    """
    Serve uploaded video files with CORS support for Creatomate.
    
    Args:
        filename: Name of the video file
        
    Returns:
        Video file response with CORS headers
    """
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    
    from fastapi.responses import FileResponse
    
    # Determine content type from extension
    content_type = "video/mp4"  # Default
    if filename.lower().endswith('.mov'):
        content_type = "video/quicktime"
    elif filename.lower().endswith('.webm'):
        content_type = "video/webm"
    elif filename.lower().endswith('.avi'):
        content_type = "video/x-msvideo"
    
    # CORS headers - critical for Creatomate access
    cors_headers = {
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    }
    
    return FileResponse(
        path=str(file_path),
        media_type=content_type,
        headers=cors_headers
    )


@router.post("/regenerate-image", response_model=AssetResult)
async def regenerate_image(
    prompt: str = Body(..., embed=True, description="Image generation prompt"),
) -> AssetResult:
    """
    Regenerate a single image using Nano Banana Pro.
    
    This endpoint allows users to regenerate a specific image with a new prompt.
    Useful for the "Regenerate" button in the frontend.
    
    Args:
        prompt: Image generation prompt (scene description)
        
    Returns:
        AssetResult with the newly generated image URL
        
    Raises:
        HTTPException: If image generation fails
    """
    try:
        image_url = await generate_image_asset(prompt)
        
        return AssetResult(
            id=image_url,
            thumbnail_url=image_url,
            video_url=image_url,
            duration_seconds=10  # Default duration for static images
        )
    except Exception as e:
        error_message = str(e) if str(e) else "We couldn't generate the image. Please try again."
        raise HTTPException(
            status_code=500,
            detail=error_message
        ) from e


@router.get("/proxy-image")
async def proxy_image(url: str = Query(..., description="Image URL to proxy")):
    """
    Proxy image requests to bypass ngrok browser warning.
    This allows the frontend to load images from ngrok URLs that require bypass headers.
    """
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Add ngrok bypass header
            headers = {"Ngrok-Skip-Browser-Warning": "true"}
            response = await client.get(url, headers=headers, follow_redirects=True)
            response.raise_for_status()
            
            # Return the image with appropriate content type
            from fastapi.responses import Response
            content_type = response.headers.get("content-type", "image/png")
            return Response(
                content=response.content,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*",
                }
            )
    except Exception as e:
        logger.error(f"Failed to proxy image {url}: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch image")


@router.get("/images/{filename}")
@router.head("/images/{filename}")
async def serve_image_for_creatomate(filename: str):
    """
    Serve images directly from disk for Creatomate and frontend previews.
    This endpoint serves images without going through static file mounting,
    which allows Creatomate to access them even through ngrok.
    The endpoint itself can be accessed via ngrok, and Creatomate will receive
    the actual image file (not the ngrok warning page) because it's an API endpoint.
    
    FastAPI automatically handles HEAD requests for GET endpoints.
    """
    try:
        from fastapi.responses import FileResponse
        from pathlib import Path
        
        # Get the image file path
        image_path = UPLOAD_DIR / filename
        
        if not image_path.exists():
            logger.error(f"Image not found: {image_path}")
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Determine content type from extension
        content_type = "image/png"
        if filename.lower().endswith(('.jpg', '.jpeg')):
            content_type = "image/jpeg"
        elif filename.lower().endswith('.gif'):
            content_type = "image/gif"
        elif filename.lower().endswith('.webp'):
            content_type = "image/webp"
        
        # CORS headers - critical for frontend image loading
        cors_headers = {
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
        
        # Serve the file with CORS headers
        return FileResponse(
            path=str(image_path),
            media_type=content_type,
            headers=cors_headers
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to serve image {filename}: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve image")
