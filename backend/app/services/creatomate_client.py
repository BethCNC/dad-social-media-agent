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
    # CRITICAL: asset.id must be a publicly accessible URL (full URL including domain)
    # For generated images, this should be {API_BASE_URL}/static/uploads/{filename}.png
    asset_urls = [asset.id for asset in request.assets]
    
    # Validate URLs are absolute (Creatomate needs full URLs)
    for i, url in enumerate(asset_urls):
        if url and not url.startswith(('http://', 'https://')):
            logger.warning(f"Asset URL {i} is not absolute: {url}. Creatomate requires full URLs.")
    
    # Build modifications object using dot notation
    # NOTE: Element names must match EXACTLY what's in your Creatomate template
    # To find element names: Open template in Creatomate editor → Select element → Check "Name" field
    # Common names: Background-1, Background-2, Video-1, Video-2, Text-1, Text-2, etc.
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
        # Add Music source (optional - use explicit music_url first, then default)
        if request.music_url:
            modifications["Music.source"] = request.music_url
            logger.info(f"Using per-post music URL for Music.source: {request.music_url[:80]}...")
        else:
            music_source = getattr(settings, "CREATOMATE_DEFAULT_MUSIC", None)
            if music_source:
                modifications["Music.source"] = music_source
                logger.info("Using CREATOMATE_DEFAULT_MUSIC for Music.source")
        
        # Map assets to Background elements (Background-1, Background-2)
        # Template expects exactly 2 video clips: Background-1 and Background-2
        if len(asset_urls) < 2:
            logger.warning(f"Video template requires 2 video clips, but only {len(asset_urls)} provided")
        
        if asset_urls:
            # Helper function to detect if URL is an image (not a video)
            def is_image_url(url: str) -> bool:
                """Check if URL points to an image file."""
                image_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.webp')
                # Also check if URL contains common image path patterns
                return any(url.lower().endswith(ext) for ext in image_extensions) or '/static/uploads/' in url.lower()
            
            # Use first two assets for Background-1 and Background-2
            if len(asset_urls) >= 1:
                asset_url_1 = asset_urls[0]
                modifications["Background-1.source"] = asset_url_1
                logger.info(f"Setting Background-1.source to: {asset_url_1[:80]}...")
                
                # If it's an image, set duration explicitly (default 5 seconds per image)
                # Note: Ken Burns animation should be configured in the Creatomate template itself
                # The template can use keyframe animations or built-in effects for pan/zoom
                if is_image_url(asset_url_1):
                    logger.info("Detected static image for Background-1, setting duration to 5 seconds")
                    # Set duration explicitly for static images (5 seconds default)
                    modifications["Background-1.duration"] = 5.0
                    # Note: For Ken Burns effect, configure the template to use:
                    # - Scale animation (e.g., 100% to 110%)
                    # - Position animation (subtle pan)
                    # This can be done via template keyframes or animation presets
                    
            if len(asset_urls) >= 2:
                asset_url_2 = asset_urls[1]
                modifications["Background-2.source"] = asset_url_2
                logger.info(f"Setting Background-2.source to: {asset_url_2[:80]}...")
                
                # If it's an image, set duration explicitly
                if is_image_url(asset_url_2):
                    logger.info("Detected static image for Background-2, setting duration to 5 seconds")
                    modifications["Background-2.duration"] = 5.0
            else:
                logger.warning("Background-2.source not set - only 1 video clip provided")
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
            logger.info(
                f"Setting Text-1.text (length: {len(text_1 if text_1 else script_text)}): "
                f"{(text_1 if text_1 else script_text)[:50]}..."
            )
            logger.info(
                f"Setting Text-2.text (length: {len(text_2)}): "
                f"{(text_2[:50] if text_2 else '(empty)')}..."
            )
    
    # Build payload with template_id and modifications
    payload = {
        "template_id": template_id,
        "modifications": modifications,
    }
    
    # Log the payload for debugging
    logger.info(f"🎬 Rendering {template_type} template with ID: {template_id}")
    logger.info(f"   Number of assets: {len(asset_urls)}")
    logger.info(f"   Asset URLs: {[url[:60] + '...' if len(url) > 60 else url for url in asset_urls]}")
    logger.info(f"   Modifications being sent: {modifications}")
    logger.info(f"   Script length: {len(request.script) if request.script else 0} characters")
    logger.info(f"   Script preview: {request.script[:100] + '...' if request.script and len(request.script) > 100 else request.script}")
    
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
            
            # Log the response for debugging
            logger.info(f"✅ Creatomate API response received: job_id={data.get('id', 'N/A')}, status={data.get('status', 'N/A')}")
            logger.debug(f"Full Creatomate response: {data}")
            
            job_id = data.get("id", "")
            status = data.get("status", "pending")
            # Video URL might be in 'url' or 'preview_url' field
            video_url = data.get("url") or data.get("preview_url")
            
            if video_url:
                logger.info(f"🎥 Video URL available immediately: {video_url[:80]}...")
            else:
                logger.info(f"⏳ Video URL not yet available, status: {status}")
            
            # Log what was sent for verification
            if template_type == "video" and len(asset_urls) >= 2:
                logger.info(f"📹 Sent 2 video URLs to template:")
                logger.info(f"   Background-1: {asset_urls[0][:80]}...")
                logger.info(f"   Background-2: {asset_urls[1][:80]}...")
            elif template_type == "video" and len(asset_urls) == 1:
                logger.warning(f"⚠️ Only 1 video URL sent, but video template expects 2")
            
            if request.script:
                script_preview = request.script[:100] + "..." if len(request.script) > 100 else request.script
                logger.info(f"📝 Sent script text ({len(request.script)} chars): {script_preview}")
            
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
            error_detail = error_data.get("message", "") or str(error_data)
            logger.error(f"Creatomate API error detail: {error_detail}")
            logger.error(f"Full error response: {error_data}")
        except:
            logger.error(f"Could not parse error response: {e.response.text}")
        raise Exception(f"Video rendering failed: {error_detail or 'Please check your template configuration and try again.'}") from e
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

