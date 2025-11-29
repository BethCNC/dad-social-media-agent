"""Creatomate API client for video rendering."""
import logging
import httpx
from app.core.config import get_settings
from app.models.video import VideoRenderRequest, RenderJob

logger = logging.getLogger(__name__)
settings = get_settings()
CREATOMATE_API_BASE = "https://api.creatomate.com/v2"


async def start_render(request: VideoRenderRequest) -> RenderJob:
    """
    Start a video or image rendering job with Creatomate using a pre-defined template.
    
    Args:
        request: Render request with assets, script, template_type, and optional title
        
    Returns:
        RenderJob with job_id and initial status
        
    Raises:
        Exception: If API call fails
    """
    headers = {
        "Authorization": f"Bearer {settings.CREATOMATE_API_KEY}",
        "Content-Type": "application/json",
    }
    
    # Select template based on template_type
    template_type = request.template_type.lower() if request.template_type else "video"
    if template_type == "image":
        template_id = settings.CREATOMATE_IMAGE_TEMPLATE_ID
    else:
        template_id = settings.CREATOMATE_VIDEO_TEMPLATE_ID
    
    # Build modifications to pass to the template
    # Creatomate uses dot notation: "ElementName.property" to modify template elements
    # Extract video/image URLs from assets
    asset_urls = [asset.id for asset in request.assets]
    
    # Build modifications object using dot notation
    # Based on template structure: Music, Background-1, Background-2, Text-1, Text-2, etc.
    modifications = {}
    
    # Add Music source (optional - can be configured or use default)
    # Using a default background music from Creatomate assets if available
    # You can override this in config if needed
    music_source = getattr(settings, 'CREATOMATE_DEFAULT_MUSIC', None)
    if music_source:
        modifications["Music.source"] = music_source
    
    # Map assets to Background elements (Background-1, Background-2, etc.)
    # Templates typically have Background-1, Background-2 for video clips
    if asset_urls:
        for i, url in enumerate(asset_urls, start=1):
            element_name = f"Background-{i}.source"
            modifications[element_name] = url
    
    # Map script text to Text elements (Text-1, Text-2)
    # Split script into two parts for better visual distribution
    if request.script:
        script_lines = request.script.strip().split('\n')
        # Split script roughly in half
        mid_point = len(script_lines) // 2
        
        # Text-1: First half of script
        text_1 = '\n'.join(script_lines[:mid_point]).strip()
        if text_1:
            modifications["Text-1.text"] = text_1
        
        # Text-2: Second half of script
        text_2 = '\n'.join(script_lines[mid_point:]).strip()
        if text_2:
            modifications["Text-2.text"] = text_2
        
        # If script is short, put it all in Text-1 and leave Text-2 empty
        if not text_2 and text_1:
            modifications["Text-1.text"] = request.script
            modifications["Text-2.text"] = ""  # Clear Text-2 if not used
    
    # Build payload with template_id and modifications
    payload = {
        "template_id": template_id,
        "modifications": modifications,
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{CREATOMATE_API_BASE}/renders",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            
            # Creatomate v2 API response structure
            # Response can be a single object or an array with one object
            if isinstance(data, list) and len(data) > 0:
                data = data[0]
            
            job_id = data.get("id", "")
            status = data.get("status", "pending")
            # Video URL might be in 'url' or 'preview_url' field
            video_url = data.get("url") or data.get("preview_url")
            
            return RenderJob(
                job_id=job_id,
                status=status,
                video_url=video_url if status == "succeeded" else None,
            )
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Creatomate API HTTP error: {e.response.status_code}")
        if e.response.status_code == 401:
            raise Exception("Invalid API key. Please check your Creatomate configuration.") from e
        if e.response.status_code == 404:
            raise Exception("Template not found. Please check your CREATOMATE_TEMPLATE_ID.") from e
        error_detail = ""
        try:
            error_data = e.response.json()
            error_detail = error_data.get("message", "")
        except:
            pass
        raise Exception(f"Video rendering is taking longer than expected. Please try again in a few minutes.") from e
    except httpx.RequestError as e:
        logger.error(f"Creatomate API request error: {type(e).__name__}")
        raise Exception("Could not connect to video rendering service. Please try again.") from e
    except Exception as e:
        logger.error(f"Creatomate API error: {type(e).__name__}: {e}")
        raise Exception("An error occurred while starting video rendering.") from e


async def get_render_status(job_id: str) -> RenderJob:
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
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{CREATOMATE_API_BASE}/renders/{job_id}",
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            
            # Creatomate v2 API response structure
            # Response can be a single object or an array with one object
            if isinstance(data, list) and len(data) > 0:
                data = data[0]
            
            # Creatomate status values: pending, rendering, succeeded, failed
            status = data.get("status", "unknown")
            video_url = None
            if status == "succeeded":
                video_url = data.get("url") or data.get("preview_url")
            
            return RenderJob(
                job_id=data.get("id", job_id),
                status=status,
                video_url=video_url,
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

