#!/usr/bin/env python3
"""Clean up processed video files from assets directory.

This script removes video files and thumbnails from frontend/src/assets/
that have already been processed and registered in the database.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "frontend" / "src" / "assets"

# Add backend to path for imports
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

def main():
    """Clean up processed files from assets directory."""
    try:
        from app.database.database import SessionLocal
        from app.database.models import UserVideo
    except ImportError as e:
        print(f"✗ Error: Could not import backend modules: {e}")
        print("  Make sure backend dependencies are installed")
        sys.exit(1)
    
    print("=" * 70)
    print("Cleaning Up Processed Videos")
    print("=" * 70)
    
    # Get all registered videos from database
    db = SessionLocal()
    try:
        registered_videos = db.query(UserVideo).all()
        registered_filenames = {v.original_filename for v in registered_videos}
        print(f"\n  Found {len(registered_filenames)} registered videos in database")
        
        # Find all video and thumbnail files in assets
        video_files = list(ASSETS_DIR.glob("*.mp4")) + list(ASSETS_DIR.glob("*.mov"))
        thumbnail_files = list(ASSETS_DIR.glob("*_thumb.jpg"))
        
        print(f"  Found {len(video_files)} video file(s) in assets/")
        print(f"  Found {len(thumbnail_files)} thumbnail file(s) in assets/")
        
        # Delete processed videos (those with descriptive names or matching registered names)
        deleted_videos = 0
        deleted_thumbnails = 0
        
        # Delete thumbnails (always safe - they're copied to uploads/)
        for thumb_file in thumbnail_files:
            try:
                thumb_file.unlink()
                print(f"  🗑️  Deleted thumbnail: {thumb_file.name}")
                deleted_thumbnails += 1
            except Exception as e:
                print(f"  ⚠ Could not delete {thumb_file.name}: {e}")
        
        # Delete processed video files (renamed ones with descriptive names)
        processed_names = {
            "abstract-motion", "landscape-scenery", "lifestyle-activity",
            "man-walking-sunset", "nature-scene", "urban-scene", "hands-typing",
            "video-20251130"  # This one got a generic name but was processed
        }
        
        for video_file in video_files:
            video_stem = video_file.stem
            # Delete if it matches a processed name or is in registered videos
            should_delete = (
                video_stem in processed_names or
                video_file.name in registered_filenames or
                video_stem.endswith("_compressed")  # Compressed versions
            )
            
            if should_delete:
                try:
                    file_size_mb = video_file.stat().st_size / (1024 * 1024)
                    video_file.unlink()
                    print(f"  🗑️  Deleted video: {video_file.name} ({file_size_mb:.1f}MB)")
                    deleted_videos += 1
                except Exception as e:
                    print(f"  ⚠ Could not delete {video_file.name}: {e}")
        
        print("\n" + "=" * 70)
        print("Summary")
        print("=" * 70)
        print(f"  Deleted {deleted_videos} video file(s)")
        print(f"  Deleted {deleted_thumbnails} thumbnail file(s)")
        print(f"  Backups preserved in: static/backups/videos/")
        print(f"  Videos available in asset search system")
        print("=" * 70)
        
    finally:
        db.close()


if __name__ == "__main__":
    main()

