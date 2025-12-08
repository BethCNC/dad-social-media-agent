import logging
import uuid
import asyncio
from typing import List, Literal

from sqlalchemy.orm import Session
from app.database.models import UserVideo, UserImage
from app.services.pexels_client import search_videos
from app.services.gemini_client import generate_image_asset

logger = logging.getLogger(__name__)

async def batch_fetch_pexels_videos(db: Session, topic: str, count: int) -> List[dict]:
    """
    Search Pexels for videos and save them to the library (UserVideo).
    Returns list of saved video dicts or existing ones.
    """
    try:
        logger.info(f"Batch fetching {count} videos for topic: {topic}")
        results = await search_videos(topic, max_results=count)
        
        saved_count = 0
        
        for result in results:
            # Check if URL already exists to avoid duplicates
            existing = db.query(UserVideo).filter(UserVideo.video_url == result.video_url).first()
            if existing:
                continue

            # Create UserVideo
            video = UserVideo(
                filename=f"pexels_{uuid.uuid4().hex[:8]}.mp4", # Dummy filename for remote asset references
                original_filename=f"Pexels: {topic}",
                video_url=result.video_url,
                thumbnail_url=result.thumbnail_url,
                duration_seconds=result.duration_seconds,
                tags=[topic, "source:pexels"],
                description=f"Auto-fetched from Pexels for topic: {topic}",
                use_count=0
            )
            db.add(video)
            saved_count += 1
        
        db.commit()
        logger.info(f"Successfully saved {saved_count} new Pexels videos")
        
        return [
            {
                "id": str(v.id) if v.id else "new", 
                "video_url": v.video_url,
                "thumbnail_url": v.thumbnail_url
            } 
            for v in db.query(UserVideo).filter(UserVideo.video_url.in_([r.video_url for r in results])).all()
        ]

    except Exception as e:
        logger.error(f"Error fetching batch Pexels videos: {e}")
        raise

async def batch_generate_ai_images(db: Session, topic: str, count: int) -> List[dict]:
    """
    Generate AI images and save them to the library (UserImage).
    Returns list of saved image dicts.
    """
    logger.info(f"Batch generating {count} AI images for topic: {topic}")
    
    # Create tasks for parallel generation
    tasks = []
    for i in range(count):
        # Add slight variation to prompt to ensure diversity if needed, 
        # largely relying on non-deterministic generation.
        # Adding a unique seed description might help if the model caches.
        prompt = f"{topic}, high quality, photorealistic, wellness aesthetic, variation {i+1}"
        tasks.append(generate_image_asset(prompt))
    
    # Run in parallel
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    saved_count = 0
    saved_images = []
    
    for i, res in enumerate(results):
        if isinstance(res, Exception):
            logger.error(f"Error generating image {i+1}: {res}")
            continue
            
        image_url = res
        
        # Create UserImage
        image = UserImage(
            filename=f"ai_gen_{uuid.uuid4().hex[:8]}.png",
            image_url=image_url,
            thumbnail_url=image_url,
            tags=[topic, "source:ai_generation"],
            description=f"AI generated for topic: {topic}",
            source="ai_generation"
        )
        db.add(image)
        saved_images.append(image)
        saved_count += 1
            
    db.commit()
    
    # Refresh ID
    for img in saved_images:
        db.refresh(img)
        
    logger.info(f"Successfully saved {saved_count} new AI images")
    
    return [
        {
            "id": str(img.id),
            "image_url": img.image_url,
            "thumbnail_url": img.thumbnail_url
        }
        for img in saved_images
    ]
