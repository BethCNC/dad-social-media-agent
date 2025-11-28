"""Creatomate API client for video rendering."""
import logging
import httpx
from app.core.config import get_settings
from app.models.video import VideoRenderRequest, RenderJob

logger = logging.getLogger(__name__)
settings = get_settings()
CREATOMATE_API_BASE = "https://rest.creatomate.com/v1"


def start_render(request: VideoRenderRequest) -> RenderJob:
    """
    Start a video rendering job with Creatomate.
    
    Args:
        request: Video render request with assets, script, and optional title
        
    Returns:
        RenderJob with job_id and initial status
        
    Raises:
        Exception: If API call fails
    """
    headers = {
        "Authorization": f"Bearer {settings.CREATOMATE_API_KEY}",
        "Content-Type": "application/json",
    }
    
    # Build Creatomate template structure
    # Using a simple vertical video template (9:16 aspect ratio)
    elements = []
    
    # Add video clips
    for i, asset in enumerate(request.assets):
        elements.append({
            "type": "video",
            "source": asset.id,  # This should be the video URL from Pexels
            "x": "0%",
            "y": "0%",
            "width": "100%",
            "height": "100%",
            "time": f"{i * 3}s",  # Stagger clips
            "duration": asset.end_at - asset.start_at if asset.end_at and asset.start_at else 3,
        })
    
    # Add text overlay for script
    if request.script:
        elements.append({
            "type": "text",
            "text": request.script,
            "x": "50%",
            "y": "80%",
            "width": "90%",
            "font_family": "Arial",
            "font_size": "24px",
            "font_weight": "600",
            "fill_color": "#ffffff",
            "stroke_color": "#000000",
            "stroke_width": "2px",
            "text_align": "center",
        })
    
    template = {
        "output_format": "mp4",
        "width": 1080,
        "height": 1920,  # 9:16 vertical format
        "elements": elements,
    }
    
    payload = {
        "template_id": None,  # Using inline template
        "modifications": template,
    }
    
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{CREATOMATE_API_BASE}/renders",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            
            return RenderJob(
                job_id=data.get("id", ""),
                status=data.get("status", "pending"),
                video_url=data.get("url") if data.get("status") == "succeeded" else None,
            )
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Creatomate API HTTP error: {e.response.status_code}")
        if e.response.status_code == 401:
            raise Exception("Invalid API key. Please check your Creatomate configuration.") from e
        raise Exception("Could not start video rendering. Please try again.") from e
    except httpx.RequestError as e:
        logger.error(f"Creatomate API request error: {type(e).__name__}")
        raise Exception("Could not connect to video rendering service. Please try again.") from e
    except Exception as e:
        logger.error(f"Creatomate API error: {type(e).__name__}: {e}")
        raise Exception("An error occurred while starting video rendering.") from e


def get_render_status(job_id: str) -> RenderJob:
    """
    Get the status of a video rendering job.
    
    Args:
        job_id: Creatomate render job ID
        
    Returns:
        RenderJob with current status and video_url if complete
        
    Raises:
        Exception: If API call fails
    """
    headers = {
        "Authorization": f"Bearer {settings.CREATOMATE_API_KEY}",
    }
    
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                f"{CREATOMATE_API_BASE}/renders/{job_id}",
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            
            return RenderJob(
                job_id=data.get("id", job_id),
                status=data.get("status", "unknown"),
                video_url=data.get("url") if data.get("status") == "succeeded" else None,
            )
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Creatomate API HTTP error: {e.response.status_code}")
        raise Exception("Could not check render status. Please try again.") from e
    except httpx.RequestError as e:
        logger.error(f"Creatomate API request error: {type(e).__name__}")
        raise Exception("Could not connect to video rendering service. Please try again.") from e
    except Exception as e:
        logger.error(f"Creatomate API error: {type(e).__name__}: {e}")
        raise Exception("An error occurred while checking render status.") from e

