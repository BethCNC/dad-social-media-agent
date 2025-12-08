import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.database.database import SessionLocal, init_db
from app.services.asset_library_service import batch_fetch_pexels_videos, batch_generate_ai_images

async def populate():
    # Ensure tables exist (especially new UserImages)
    init_db()
    
    db = SessionLocal()
    try:
        print("Starting brand content population...")
        
        # 1. Fetch Videos (Pexels) - 10 total
        try:
            # Topic 1: Morning/Drink focus (5 videos)
            print("\nFetching videos: Wellness Drink/Morning...")
            videos_1 = await batch_fetch_pexels_videos(
                db, 
                topic="making matcha tea morning routine glass", 
                count=5
            )
            print(f"Fetched {len(videos_1)} drink videos")

            # Topic 2: Active/Lifestyle (5 videos)
            print("\nFetching videos: Active Lifestyle...")
            videos_2 = await batch_fetch_pexels_videos(
                db, 
                topic="healthy woman yoga nature happiness no face", 
                count=5
            )
            print(f"Fetched {len(videos_2)} lifestyle videos")
        except Exception as e:
            print(f"Error fetching videos: {e}")

        # 2. Generate Images (AI) - 10 total
        try:
            # Topic 1: Product/Drink Aesthetic (5 images)
            print("\nGenerating images: Product Aesthetic...")
            images_1 = await batch_generate_ai_images(
                db, 
                topic="Professional product photography of a refreshing green yerba mate drink in a modern glass, nice ice, mint garnish, bright sunny modern kitchen counter, 8k, photorealistic", 
                count=5
            )
            print(f"Generated {len(images_1)} product images")

            # Topic 2: Lifestyle Aesthetic (5 images)
            print("\nGenerating images: Lifestyle Aesthetic...")
            images_2 = await batch_generate_ai_images(
                db, 
                topic="Aesthetic wellness lifestyle shot, orange fiber drink supplement in a shaker bottle, gym bag, yoga mat, healthy vibe, soft lighting, 8k", 
                count=5
            )
            print(f"Generated {len(images_2)} lifestyle images")
        except Exception as e:
            print(f"Error generating images: {e}")

        print("\nDone! Content added to Asset Library.")

    except Exception as e:
        print(f"Critical Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(populate())
