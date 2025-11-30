"""Pexels API client for stock video search."""
import logging
import httpx
from app.core.config import get_settings
from app.models.video import AssetResult

logger = logging.getLogger(__name__)
settings = get_settings()
PEXELS_API_BASE = "https://api.pexels.com/videos"


async def search_videos(query: str, max_results: int = 10) -> list[AssetResult]:
    """
    Search for stock videos on Pexels, excluding people and faces.
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return (default 10)
        
    Returns:
        List of AssetResult objects (filtered to exclude people/faces)
        
    Raises:
        Exception: If API call fails
    """
    headers = {
        "Authorization": settings.PEXELS_API_KEY,
    }
    
    # Modify query to exclude people, faces, and human subjects (HEADLESS ACCOUNT - NO PEOPLE)
    # Add comprehensive exclusion terms to the query
    exclusion_terms = [
        " -person", " -people", " -face", " -faces", " -human", " -woman", " -man", 
        " -men", " -women", " -girl", " -boy", " -child", " -children", " -adult",
        " -hands", " -hand", " -portrait", " -headshot", " -crowd", " -group",
        " -person's", " -people's", " -family", " -couple", " -individual"
    ]
    modified_query = query + "".join(exclusion_terms)
    
    params = {
        "query": modified_query,
        "per_page": min(max_results * 2, 80),  # Request more to account for filtering
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{PEXELS_API_BASE}/search",
                headers=headers,
                params=params,
            )
            response.raise_for_status()
            data = response.json()
            
            assets = []
            # Comprehensive keywords that indicate people/faces in video titles or descriptions
            # HEADLESS ACCOUNT - STRICT FILTERING FOR NO PEOPLE
            people_keywords = [
                "person", "people", "face", "faces", "human", "woman", "man", 
                "men", "women", "girl", "boy", "child", "children", "adult",
                "portrait", "headshot", "crowd", "group", "individual", "person's",
                "people's", "family", "couple", "teen", "teenager", "elderly",
                "senior", "young", "old", "baby", "infant", "toddler", "kid", "kids"
            ]
            
            for video in data.get("videos", []):
                # Filter out videos with people-related keywords in title or description
                video_title = video.get("url", "").lower() + " " + str(video.get("id", "")).lower()
                video_description = video.get("alt", "").lower() if video.get("alt") else ""
                video_text = video_title + " " + video_description
                
                # Skip if video contains people-related keywords
                if any(keyword in video_text for keyword in people_keywords):
                    continue
                
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
                
                # Use video_url as id since Creatomate needs the URL, not just an ID
                video_url = best_video.get("link", "")
                assets.append(
                    AssetResult(
                        id=video_url,  # Use video URL as ID (Creatomate expects URL in asset.id)
                        thumbnail_url=thumbnail,
                        video_url=video_url,
                        duration_seconds=video.get("duration", 0),
                    )
                )
                
                # Stop once we have enough results
                if len(assets) >= max_results:
                    break
            
            return assets
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Pexels API HTTP error: {e.response.status_code}")
        raise Exception("We couldn't load stock clips right now.") from e
    except httpx.RequestError as e:
        logger.error(f"Pexels API request error: {type(e).__name__}")
        raise Exception("We couldn't load stock clips right now.") from e
    except Exception as e:
        logger.error(f"Pexels API error: {type(e).__name__}: {e}")
        raise Exception("We couldn't load stock clips right now.") from e

