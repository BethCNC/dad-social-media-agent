"""Pexels API client for stock video search."""
import logging
import httpx
from app.core.config import get_settings
from app.models.video import AssetResult

logger = logging.getLogger(__name__)
settings = get_settings()
PEXELS_API_BASE = "https://api.pexels.com/videos"


def search_videos(query: str, max_results: int = 10) -> list[AssetResult]:
    """
    Search for stock videos on Pexels.
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return (default 10)
        
    Returns:
        List of AssetResult objects
        
    Raises:
        Exception: If API call fails
    """
    headers = {
        "Authorization": settings.PEXELS_API_KEY,
    }
    
    params = {
        "query": query,
        "per_page": min(max_results, 80),  # Pexels max is 80 per page
    }
    
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                f"{PEXELS_API_BASE}/search",
                headers=headers,
                params=params,
            )
            response.raise_for_status()
            data = response.json()
            
            assets = []
            for video in data.get("videos", [])[:max_results]:
                # Get the best quality video file (prefer HD, fallback to SD)
                video_files = video.get("video_files", [])
                if not video_files:
                    continue
                
                # Sort by width descending to get highest quality
                video_files.sort(key=lambda x: x.get("width", 0), reverse=True)
                best_video = video_files[0]
                
                # Get thumbnail
                image = video.get("image", "")
                thumbnail = image if image else video_files[0].get("link", "")
                
                assets.append(
                    AssetResult(
                        id=str(video.get("id", "")),
                        thumbnail_url=thumbnail,
                        video_url=best_video.get("link", ""),
                        duration_seconds=video.get("duration", 0),
                    )
                )
            
            return assets
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Pexels API HTTP error: {e.response.status_code}")
        raise Exception("Could not search for videos. Please try again.") from e
    except httpx.RequestError as e:
        logger.error(f"Pexels API request error: {type(e).__name__}")
        raise Exception("Could not connect to video search. Please try again.") from e
    except Exception as e:
        logger.error(f"Pexels API error: {type(e).__name__}: {e}")
        raise Exception("An error occurred while searching for videos.") from e

