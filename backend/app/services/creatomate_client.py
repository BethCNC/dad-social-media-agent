"""Creatomate API client for video rendering."""
import logging
import re
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
        logger.info(f"Using image template ID: {template_id}")
    else:
        template_id = settings.CREATOMATE_VIDEO_TEMPLATE_ID
        logger.info(f"Using video template ID: {template_id}")
    
    # Validate template ID is not empty
    if not template_id or not template_id.strip():
        raise ValueError(f"Template ID for {template_type} is empty. Please set CREATOMATE_{template_type.upper()}_TEMPLATE_ID in your .env file.")
    
    # Build modifications to pass to the template
    # Creatomate uses dot notation: "ElementName.property" to modify template elements
    # Extract video/image URLs from assets
    asset_urls = [asset.id for asset in request.assets]
    
    # Build modifications object using dot notation
    # Image templates use: Image.source, Text.text
    # Video templates use: Music.source, Background-1.source, Background-2.source, Text-1.text, Text-2.text
    modifications = {}
    
    if template_type == "image":
        # Image template structure: Image.source, Text.text
        if asset_urls:
            # Use first asset as the image source
            modifications["Image.source"] = asset_urls[0]
            if len(asset_urls) > 1:
                logger.warning(f"Image template only supports 1 image, using first of {len(asset_urls)} assets")
        
        # Map script text to Text.text (single text element for images)
        if request.script:
            modifications["Text.text"] = request.script.strip()
    
    else:
        # Video template structure: Music, Background-1, Background-2, Text-1, Text-2
        # Add Music source (optional - can be configured or use default)
        music_source = getattr(settings, 'CREATOMATE_DEFAULT_MUSIC', None)
        if music_source:
            modifications["Music.source"] = music_source
        
        # Map assets to Background elements (Background-1, Background-2)
        # Template expects exactly 2 video clips: Background-1 and Background-2
        if asset_urls:
            # Use first two assets for Background-1 and Background-2
            if len(asset_urls) >= 1:
                modifications["Background-1.source"] = asset_urls[0]
            if len(asset_urls) >= 2:
                modifications["Background-2.source"] = asset_urls[1]
            # If more than 2 assets, we'll use the first 2 (template only has 2 slots)
            if len(asset_urls) > 2:
                logger.warning(f"Video template only supports 2 video clips, using first 2 of {len(asset_urls)} assets")
        
        # Map script text to Text elements (Text-1, Text-2)
        # Split script into two parts for better visual distribution
        if request.script:
            script_text = request.script.strip()
            
            # Try to split by newlines first (if script has structured sections)
            if '\n' in script_text:
                lines = [line.strip() for line in script_text.split('\n') if line.strip()]
                mid_point = len(lines) // 2
                
                text_1 = '\n'.join(lines[:mid_point]).strip()
                text_2 = '\n'.join(lines[mid_point:]).strip()
            else:
                # Split by sentences (period, exclamation, question mark)
                sentences = re.split(r'([.!?]\s+)', script_text)
                # Rejoin sentences with their punctuation
                sentences = [sentences[i] + (sentences[i+1] if i+1 < len(sentences) else '') 
                            for i in range(0, len(sentences), 2) if sentences[i].strip()]
                
                mid_point = len(sentences) // 2
                text_1 = ''.join(sentences[:mid_point]).strip()
                text_2 = ''.join(sentences[mid_point:]).strip()
            
            # Set Text-1 and Text-2
            modifications["Text-1.text"] = text_1 if text_1 else script_text
            modifications["Text-2.text"] = text_2 if text_2 else ""
    
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

