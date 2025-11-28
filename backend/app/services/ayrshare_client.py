"""Ayrshare API client for social media scheduling."""
import logging
import httpx
from datetime import datetime
from app.core.config import get_settings
from app.models.social import ScheduleRequest, ScheduleResponse

logger = logging.getLogger(__name__)
settings = get_settings()
AYRSHARE_API_BASE = "https://app.ayrshare.com/api"


async def schedule_post(request: ScheduleRequest) -> ScheduleResponse:
    """
    Schedule a social media post via Ayrshare.
    
    Args:
        request: Schedule request with video_url, caption, platforms, and optional scheduled_time
        
    Returns:
        ScheduleResponse with provider_id, status, and external_links
        
    Raises:
        Exception: If API call fails
    """
    headers = {
        "Authorization": f"Bearer {settings.AYRSHARE_API_KEY}",
        "Content-Type": "application/json",
    }
    
    # Build Ayrshare payload
    payload = {
        "post": request.caption,
        "platforms": request.platforms,
        "mediaUrls": [request.video_url],
    }
    
    # Add schedule time if provided
    if request.scheduled_time:
        # Ayrshare expects ISO 8601 format
        if isinstance(request.scheduled_time, datetime):
            payload["scheduleDate"] = request.scheduled_time.isoformat()
        else:
            payload["scheduleDate"] = request.scheduled_time
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{AYRSHARE_API_BASE}/post",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract status and IDs from Ayrshare response
            status = data.get("status", "unknown")
            post_ids = data.get("ids", {})
            
            # Build external links from post IDs
            external_links = []
            for platform, post_id in post_ids.items():
                if post_id:
                    # Construct platform-specific URLs if available
                    if platform.lower() == "instagram":
                        external_links.append(f"https://www.instagram.com/p/{post_id}/")
                    elif platform.lower() == "tiktok":
                        external_links.append(f"https://www.tiktok.com/@user/video/{post_id}")
            
            return ScheduleResponse(
                provider_id=data.get("id", ""),
                status=status,
                external_links=external_links if external_links else None,
            )
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Ayrshare API HTTP error: {e.response.status_code}")
        if e.response.status_code == 401:
            raise Exception("Invalid API key. Please check your Ayrshare configuration.") from e
        error_detail = ""
        try:
            if e.response.headers.get("content-type", "").startswith("application/json"):
                error_data = e.response.json()
                error_detail = error_data.get("message", "Unknown error")
        except:
            error_detail = "Unknown error"
        raise Exception(f"We couldn't schedule this post. Please check your Ayrshare connection and try again.") from e
    except httpx.RequestError as e:
        logger.error(f"Ayrshare API request error: {type(e).__name__}")
        raise Exception("We couldn't schedule this post. Please check your Ayrshare connection and try again.") from e
    except Exception as e:
        logger.error(f"Ayrshare API error: {type(e).__name__}: {e}")
        raise Exception("We couldn't schedule this post. Please check your Ayrshare connection and try again.") from e

