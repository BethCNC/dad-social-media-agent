"""Trend surveillance API routes."""
from fastapi import APIRouter, HTTPException
from typing import Optional
from app.services.trend_service import fetch_trending_videos, get_relevant_hashtags
from app.services.gemini_client import analyze_social_trend
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/latest")
async def get_latest_trends(
    hashtag: Optional[str] = None,
    max_videos: int = 10
) -> dict:
    """
    Fetch trending videos and analyze them to generate a remix idea.
    
    Args:
        hashtag: Optional specific hashtag to search (defaults to first relevant hashtag)
        max_videos: Maximum number of videos to analyze (default 10)
        
    Returns:
        Dictionary with trend analysis including: trend_title, why_it_works, hook_script, suggested_caption
        
    Raises:
        HTTPException: If trend analysis fails
    """
    try:
        # Get hashtag to search
        if not hashtag:
            relevant_hashtags = get_relevant_hashtags()
            hashtag = relevant_hashtags[0] if relevant_hashtags else "feelgreatsystem"
        
        # Fetch trending videos
        logger.info(f"Fetching trending videos for #{hashtag}")
        videos = fetch_trending_videos(hashtag, max_results=max_videos)
        
        if not videos:
            raise HTTPException(
                status_code=404,
                detail="No trending videos found for the specified hashtag."
            )
        
        # Extract descriptions/captions
        descriptions = [video.get("description", "") for video in videos if video.get("description")]
        
        if not descriptions:
            raise HTTPException(
                status_code=404,
                detail="No video descriptions found to analyze."
            )
        
        # Analyze trends using Gemini
        logger.info(f"Analyzing {len(descriptions)} video descriptions with Gemini")
        trend_analysis = await analyze_social_trend(descriptions)
        
        # Add metadata
        trend_analysis["hashtag_searched"] = hashtag
        trend_analysis["videos_analyzed"] = len(descriptions)
        
        return trend_analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching trends: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch and analyze trends: {str(e)}"
        ) from e

