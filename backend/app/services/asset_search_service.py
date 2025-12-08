"""AI image generation service using Gemini Nano Banana Pro with Pexels fallback."""
import logging
import random
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.video import AssetResult
from app.database.models import UserVideo

logger = logging.getLogger(__name__)


def get_user_videos(db: Session, max_count: int = 5) -> List[AssetResult]:
    """
    Get user-uploaded videos, prioritizing less-used ones.
    
    Args:
        db: Database session
        max_count: Maximum number of user videos to include
        
    Returns:
        List of AssetResult objects from user videos
    """
    try:
        # Get user videos, prioritizing those used less frequently
        # Order by use_count ascending, then by last_used_at (nulls first)
        videos = db.query(UserVideo).order_by(
            UserVideo.use_count.asc(),
            UserVideo.last_used_at.asc().nullsfirst()
        ).limit(max_count * 2).all()  # Get more than needed for randomization
        
        if not videos:
            return []
        
        # Randomly select from the least-used videos
        selected = random.sample(videos, min(len(videos), max_count))
        
        # Convert to AssetResult format
        results = []
        for video in selected:
            # Generate a thumbnail URL (use video URL as fallback)
            thumbnail_url = video.thumbnail_url or video.video_url
            
            # Estimate duration if not set (default to 10 seconds)
            duration = video.duration_seconds or 10
            
            # Use video_url as id since Creatomate needs the URL, not just an ID
            # Convert relative URLs to absolute if needed (backend will handle this, but set it here for consistency)
            video_url = video.video_url
            results.append(AssetResult(
                id=video_url,  # Use video URL as ID (Creatomate expects URL in asset.id)
                thumbnail_url=thumbnail_url,
                video_url=video_url,
                duration_seconds=duration
            ))
        
        return results
    except Exception as e:
        logger.warning(f"Error fetching user videos: {e}")
        return []


async def generate_campaign_assets(
    topic: str,
    hook: str,
    script: str,
    shot_plan: List[dict],
    content_pillar: str,
    suggested_keywords: Optional[List[str]] = None,
    max_results: int = 12,
    db: Optional[Session] = None,
    mode: str = "pexels"  # 'pexels' or 'ai_generation'
) -> List[AssetResult]:
    """
    Generate assets based on shot plan descriptions using either Pexels videos or AI-generated images.
    
    Args:
        topic: Post topic
        hook: Post hook
        script: Post script
        shot_plan: List of shot descriptions with duration_seconds (scenes from content plan)
        content_pillar: Content pillar (education, routine, story, product_integration)
        suggested_keywords: Optional AI-suggested keywords (used for Pexels search)
        max_results: Maximum number of results to return
        db: Optional database session for user videos
        mode: 'pexels' for stock video search, 'ai_generation' for AI-generated images
        
    Returns:
        List of AssetResult objects with video URLs (Pexels) or image URLs (AI generation)
    """
    all_results: List[AssetResult] = []
    seen_ids = set()
    
    if mode == "pexels":
        # Use Pexels video search for each shot description
        from app.services.pexels_client import search_videos
        
        for shot in shot_plan[:max_results]:
            shot_desc = shot.get("description", "")
            duration = shot.get("duration_seconds", 10)
            
            if not shot_desc:
                continue
            
            try:
                # Search Pexels for videos matching this shot description
                pexels_results = await search_videos(shot_desc, max_results=1)
                if pexels_results:
                    asset = pexels_results[0]
                    # Update duration from shot plan
                    asset.duration_seconds = duration
                    if asset.id not in seen_ids:
                        seen_ids.add(asset.id)
                        all_results.append(asset)
                        logger.info(f"Found Pexels video for scene: {shot_desc[:50]}...")
            except Exception as pexels_error:
                logger.error(f"Pexels search failed for '{shot_desc}': {pexels_error}")
                # Continue to next shot
                continue
    
    elif mode == "ai_generation":
        # Generate AI images for each shot description
        from app.services.gemini_client import generate_image_asset
        
        for shot in shot_plan[:max_results]:
            shot_desc = shot.get("description", "")
            duration = shot.get("duration_seconds", 10)
            
            if not shot_desc:
                continue
            
            try:
                # Generate AI image for this shot description
                image_url = await generate_image_asset(shot_desc)
                
                # Create AssetResult object with generated image URL
                asset = AssetResult(
                    id=image_url,  # Use image URL as ID (Creatomate expects URL in asset.id)
                    thumbnail_url=image_url,
                    video_url=image_url,  # Static images work in Creatomate templates
                    duration_seconds=duration
                )
                
                if asset.id not in seen_ids:
                    seen_ids.add(asset.id)
                    all_results.append(asset)
                    logger.info(f"Successfully generated image for scene: {shot_desc[:50]}...")
                    
            except Exception as e:
                logger.error(f"AI image generation failed for shot description '{shot_desc}': {e}")
                # Continue to next shot (no fallback in pure AI mode)
                continue
    
    else:
        raise ValueError(f"Invalid mode: {mode}. Must be 'pexels' or 'ai_generation'")
    
    # Include user-uploaded videos if database session provided (only in pexels mode)
    if db and mode == "pexels":
        try:
            user_videos = get_user_videos(db, max_count=3)  # Include 3 user videos
            for user_video in user_videos:
                if user_video.id not in seen_ids:
                    seen_ids.add(user_video.id)
                    all_results.append(user_video)
        except Exception as e:
            logger.warning(f"Error including user videos: {e}")
    
    # Return results
    return all_results[:max_results]


# Keep old function name for backward compatibility
async def generate_relevant_assets(
    topic: str,
    hook: str,
    script: str,
    shot_plan: List[dict],
    content_pillar: str,
    suggested_keywords: Optional[List[str]] = None,
    max_results: int = 12,
    db: Optional[Session] = None,
    mode: str = "pexels"
) -> List[AssetResult]:
    """
    Backward compatibility wrapper - redirects to generate_campaign_assets.
    """
    return await generate_campaign_assets(
        topic=topic,
        hook=hook,
        script=script,
        shot_plan=shot_plan,
        content_pillar=content_pillar,
        suggested_keywords=suggested_keywords,
        max_results=max_results,
        db=db,
        mode=mode
    )


# Keep the old function name for backward compatibility
async def search_relevant_assets(
    topic: str,
    hook: str,
    script: str,
    shot_plan: List[dict],
    content_pillar: str,
    suggested_keywords: Optional[List[str]] = None,
    max_results: int = 12,
    db: Optional[Session] = None,
    mode: str = "pexels"
) -> List[AssetResult]:
    """
    Backward compatibility wrapper - redirects to generate_campaign_assets.
    """
    return await generate_campaign_assets(
        topic=topic,
        hook=hook,
        script=script,
        shot_plan=shot_plan,
        content_pillar=content_pillar,
        suggested_keywords=suggested_keywords,
        max_results=max_results,
        db=db,
        mode=mode
    )



