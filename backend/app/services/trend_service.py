"""Trend surveillance service using Apify to fetch trending TikTok videos."""
import logging
from typing import List, Dict, Optional
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def fetch_trending_videos(hashtag: str, max_results: int = 10) -> List[Dict]:
    """
    Fetch trending TikTok videos for a given hashtag using Apify.
    
    Args:
        hashtag: Hashtag to search for (e.g., "#feelgreatsystem", "#insulinresistance")
        max_results: Maximum number of videos to return (default 10)
        
    Returns:
        List of video dictionaries with keys: video_url, author_name, description, view_count
        
    Note:
        If Apify is not configured or fails, returns a mock list so the UI doesn't break.
    """
    # Remove # if present
    hashtag_clean = hashtag.lstrip('#')
    
    # Check if Apify is configured
    if not settings.APIFY_API_TOKEN or settings.APIFY_API_TOKEN == "":
        logger.warning("APIFY_API_TOKEN not configured. Returning mock trending data.")
        return _get_mock_trending_data(hashtag_clean)
    
    try:
        from apify_client import ApifyClient
        
        # Initialize Apify client
        apify_client = ApifyClient(settings.APIFY_API_TOKEN)
        
        # Run the TikTok hashtag scraper actor
        # Actor ID: clockworks/tiktok-hashtag-scraper
        run = apify_client.actor("clockworks/tiktok-hashtag-scraper").call(
            run_input={
                "hashtags": [hashtag_clean],
                "resultsLimit": max_results,
            }
        )
        
        # Fetch results
        items = list(apify_client.dataset(run["defaultDatasetId"]).iterate_items())
        
        # Transform to our format
        videos = []
        for item in items[:max_results]:
            videos.append({
                "video_url": item.get("videoUrl", ""),
                "author_name": item.get("authorMeta", {}).get("name", "Unknown"),
                "description": item.get("text", ""),
                "view_count": item.get("playCount", 0),
                "like_count": item.get("diggCount", 0),
                "share_count": item.get("shareCount", 0),
            })
        
        logger.info(f"Fetched {len(videos)} trending videos for #{hashtag_clean}")
        return videos
        
    except ImportError:
        logger.warning("apify-client not installed. Returning mock trending data.")
        return _get_mock_trending_data(hashtag_clean)
    except Exception as e:
        logger.error(f"Apify API error: {type(e).__name__}: {e}")
        logger.warning("Falling back to mock trending data.")
        return _get_mock_trending_data(hashtag_clean)


def _get_mock_trending_data(hashtag: str) -> List[Dict]:
    """
    Return mock trending data when Apify is unavailable.
    
    This ensures the UI doesn't break if Apify is not configured.
    """
    return [
        {
            "video_url": "https://example.com/video1",
            "author_name": "Wellness Creator",
            "description": f"Feeling that 3pm crash? Here's what I do to keep my energy stable throughout the day. #{hashtag} #energy #wellness",
            "view_count": 125000,
            "like_count": 8500,
            "share_count": 320,
        },
        {
            "video_url": "https://example.com/video2",
            "author_name": "Health Tips Daily",
            "description": f"3 habits that changed my energy levels. No more afternoon crashes! #{hashtag} #healthyliving",
            "view_count": 98000,
            "like_count": 7200,
            "share_count": 280,
        },
        {
            "video_url": "https://example.com/video3",
            "author_name": "Metabolic Health",
            "description": f"Struggling with cravings? This simple routine helped me so much. #{hashtag} #metabolichealth",
            "view_count": 156000,
            "like_count": 11200,
            "share_count": 450,
        },
    ]


def get_relevant_hashtags() -> List[str]:
    """
    Get list of relevant hashtags to monitor for trends.
    
    Returns:
        List of hashtags (without # prefix)
    """
    return [
        "feelgreatsystem",
        "insulinresistance",
        "metabolichealth",
        "bloodsugar",
        "energycrash",
        "afternooncrash",
        "stableenergy",
        "unicity",
    ]

