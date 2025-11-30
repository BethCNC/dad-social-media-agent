#!/usr/bin/env python3
"""Process stock videos: rename, compress, backup, and register in database.

This script:
1. Analyzes videos in frontend/src/assets/
2. Renames them with descriptive names
3. Compresses large videos using ffmpeg
4. Creates backups in a backup directory
5. Uploads them to backend storage and registers in database
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# Add backend to path for imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

# Video settings
MAX_FILE_SIZE_MB = 50  # Compress videos larger than this
TARGET_VIDEO_QUALITY = "medium"  # low, medium, high
BACKUP_DIR = PROJECT_ROOT / "static" / "backups" / "videos"
ASSETS_DIR = PROJECT_ROOT / "frontend" / "src" / "assets"
UPLOAD_DIR = PROJECT_ROOT / "static" / "uploads"

# Video name mapping based on filename patterns
VIDEO_NAME_MAPPING = {
    "1583289": "nature-scene",
    "3171": "abstract-motion",
    "47601": "lifestyle-activity",
    "6547805": "landscape-scenery",
    "8257": "urban-scene",
    "hands-typing": "hands-typing",
    "man-walking": "man-walking-sunset",
    "camera-vehicle": "vehicle-driving",
}

# Video tag suggestions based on content
VIDEO_TAGS = {
    "nature-scene": ["nature", "outdoor", "landscape"],
    "abstract-motion": ["abstract", "motion", "background"],
    "lifestyle-activity": ["lifestyle", "activity", "people"],
    "landscape-scenery": ["landscape", "scenery", "outdoor"],
    "urban-scene": ["urban", "city", "street"],
    "hands-typing": ["work", "productivity", "typing", "office"],
    "man-walking-sunset": ["walking", "sunset", "outdoor", "peaceful"],
    "vehicle-driving": ["driving", "travel", "motion", "road"],
}


def check_ffmpeg() -> bool:
    """Check if ffmpeg is installed."""
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            check=True,
            capture_output=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def get_video_duration(file_path: Path) -> Optional[int]:
    """Get video duration in seconds using ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(file_path)
            ],
            capture_output=True,
            text=True,
            check=True
        )
        duration = float(result.stdout.strip())
        return int(duration)
    except Exception as e:
        print(f"  ⚠ Could not get duration for {file_path.name}: {e}")
        return None


def get_video_info(file_path: Path) -> Dict:
    """Get video metadata using ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height,bit_rate,codec_name",
                "-show_entries", "format=duration,size",
                "-of", "json",
                str(file_path)
            ],
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        print(f"  ⚠ Could not get video info for {file_path.name}: {e}")
        return {}


def compress_video(input_path: Path, output_path: Path, quality: str = "medium") -> bool:
    """Compress video using ffmpeg.
    
    Args:
        input_path: Input video file
        output_path: Output video file
        quality: 'low', 'medium', or 'high'
        
    Returns:
        True if successful, False otherwise
    """
    # Quality presets
    quality_settings = {
        "low": {
            "crf": "28",
            "preset": "fast",
            "max_bitrate": "2M",
            "bufsize": "4M"
        },
        "medium": {
            "crf": "23",
            "preset": "medium",
            "max_bitrate": "5M",
            "bufsize": "10M"
        },
        "high": {
            "crf": "20",
            "preset": "slow",
            "max_bitrate": "10M",
            "bufsize": "20M"
        }
    }
    
    settings = quality_settings.get(quality, quality_settings["medium"])
    
    print(f"  📹 Compressing video (quality: {quality})...")
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-i", str(input_path),
                "-c:v", "libx264",
                "-crf", settings["crf"],
                "-preset", settings["preset"],
                "-maxrate", settings["max_bitrate"],
                "-bufsize", settings["bufsize"],
                "-c:a", "aac",
                "-b:a", "128k",
                "-movflags", "+faststart",  # Web optimization
                "-y",  # Overwrite output
                str(output_path)
            ],
            check=True,
            capture_output=True
        )
        
        # Check if compression actually reduced size
        original_size = input_path.stat().st_size
        compressed_size = output_path.stat().st_size
        
        if compressed_size < original_size:
            reduction = ((original_size - compressed_size) / original_size) * 100
            print(f"  ✓ Compressed: {original_size / (1024*1024):.1f}MB → {compressed_size / (1024*1024):.1f}MB ({reduction:.1f}% reduction)")
            return True
        else:
            print(f"  ⚠ Compression didn't reduce size, keeping original")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Compression failed: {e}")
        return False


def generate_thumbnail(video_path: Path, thumbnail_path: Path) -> bool:
    """Generate thumbnail from video using ffmpeg."""
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-i", str(video_path),
                "-ss", "00:00:01",  # 1 second into video
                "-vframes", "1",
                "-vf", "scale=320:-1",  # Scale to 320px width
                "-y",
                str(thumbnail_path)
            ],
            check=True,
            capture_output=True
        )
        return True
    except Exception as e:
        print(f"  ⚠ Could not generate thumbnail: {e}")
        return False


def suggest_name(filename: str) -> str:
    """Suggest a descriptive name based on filename."""
    filename_lower = filename.lower()
    
    # Check against known patterns
    for pattern, name in VIDEO_NAME_MAPPING.items():
        if pattern in filename_lower:
            return name
    
    # Extract meaningful parts from filename
    # Remove common prefixes/suffixes
    name = filename_lower
    for prefix in ["vecteezy_", "pexels-", "pexels_", "small", "hd", "uhd", "fps"]:
        name = name.replace(prefix, "")
    
    # Remove file extension
    name = Path(name).stem
    
    # Clean up
    name = name.replace("_", "-").replace("--", "-")
    name = name.strip("-")
    
    # If still too long or unclear, use a generic name
    if len(name) > 30 or not name:
        name = f"video-{datetime.now().strftime('%Y%m%d')}"
    
    return name


def process_video(video_path: Path, dry_run: bool = False, auto_accept: bool = False) -> Optional[Dict]:
    """Process a single video file.
    
    Returns:
        Dict with processing info, or None if failed
    """
    print(f"\n📹 Processing: {video_path.name}")
    
    # Get file info
    file_size_mb = video_path.stat().st_size / (1024 * 1024)
    print(f"  Size: {file_size_mb:.1f}MB")
    
    # Get video metadata
    video_info = get_video_info(video_path)
    duration = get_video_duration(video_path)
    
    if duration:
        print(f"  Duration: {duration}s")
    
    # Suggest name
    suggested_name = suggest_name(video_path.stem)
    print(f"  Suggested name: {suggested_name}")
    
    # Ask user for confirmation/override (skip if auto_accept)
    if not dry_run and not auto_accept:
        user_name = input(f"  Enter name (or press Enter for '{suggested_name}'): ").strip()
        if user_name:
            suggested_name = user_name.replace(" ", "-").lower()
    elif auto_accept:
        print(f"  ✓ Auto-accepting suggested name: {suggested_name}")
    
    # Determine if compression needed
    needs_compression = file_size_mb > MAX_FILE_SIZE_MB
    if needs_compression:
        print(f"  ⚠ File is large ({file_size_mb:.1f}MB), will compress")
    
    if dry_run:
        return {
            "original_path": str(video_path),
            "suggested_name": suggested_name,
            "file_size_mb": file_size_mb,
            "duration": duration,
            "needs_compression": needs_compression,
        }
    
    # Create backup
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = BACKUP_DIR / video_path.name
    print(f"  💾 Creating backup...")
    shutil.copy2(video_path, backup_path)
    print(f"  ✓ Backup created: {backup_path}")
    
    # Process video
    final_video_path = video_path  # Will be updated if compressed
    
    if needs_compression:
        compressed_path = video_path.parent / f"{suggested_name}_compressed.mp4"
        if compress_video(video_path, compressed_path, TARGET_VIDEO_QUALITY):
            final_video_path = compressed_path
        else:
            print(f"  ⚠ Keeping original file")
    
    # Rename to final name
    final_name = f"{suggested_name}.mp4"
    final_path = video_path.parent / final_name
    
    # Track what needs to be deleted after upload
    files_to_delete = []
    
    # If we have a compressed version, use that; otherwise rename original
    if final_video_path != video_path:
        # Move compressed version to final name
        if final_path.exists():
            final_path.unlink()
        final_video_path.rename(final_path)
        # Original file still exists and should be deleted
        if video_path.exists():
            files_to_delete.append(video_path)
    else:
        # Just rename original
        if final_path.exists() and final_path != video_path:
            final_path.unlink()
        video_path.rename(final_path)
        # video_path no longer exists (was renamed), only final_path exists
    
    # The final_path in assets/ will be deleted after copy to uploads/
    if final_path.exists():
        files_to_delete.append(final_path)
    
    # Generate thumbnail
    thumbnail_path = video_path.parent / f"{suggested_name}_thumb.jpg"
    generate_thumbnail(final_path, thumbnail_path)
    
    # Get tags
    tags = VIDEO_TAGS.get(suggested_name, ["stock-video", "b-roll"])
    
    return {
        "original_path": str(backup_path),
        "files_to_delete": [str(f) for f in files_to_delete],  # Files in assets/ to delete after upload
        "final_path": str(final_path),
        "final_name": final_name,
        "thumbnail_path": str(thumbnail_path) if thumbnail_path.exists() else None,
        "file_size_mb": final_path.stat().st_size / (1024 * 1024),
        "duration": duration,
        "tags": tags,
        "suggested_name": suggested_name,
    }


def cleanup_original_files(video_info: Dict) -> bool:
    """Delete original video files from assets directory after successful processing.
    
    Args:
        video_info: Video processing info dict
        
    Returns:
        True if cleanup successful, False otherwise
    """
    deleted_count = 0
    
    # Delete files from assets/ directory
    for file_path_str in video_info.get("files_to_delete", []):
        file_path = Path(file_path_str)
        if file_path.exists() and ASSETS_DIR in file_path.parents:
            try:
                file_path.unlink()
                print(f"  🗑️  Deleted from assets: {file_path.name}")
                deleted_count += 1
            except Exception as e:
                print(f"  ⚠ Could not delete {file_path.name}: {e}")
    
    # Delete thumbnail from assets/ (it's been copied to uploads/)
    if video_info.get("thumbnail_path"):
        thumb_path = Path(video_info["thumbnail_path"])
        if thumb_path.exists() and ASSETS_DIR in thumb_path.parents:
            try:
                thumb_path.unlink()
                print(f"  🗑️  Deleted thumbnail from assets: {thumb_path.name}")
                deleted_count += 1
            except Exception as e:
                print(f"  ⚠ Could not delete thumbnail {thumb_path.name}: {e}")
    
    return deleted_count > 0


def upload_to_backend(video_info: Dict) -> bool:
    """Upload video to backend storage and register in database.
    
    This copies the file to the upload directory and creates a database entry.
    """
    try:
        # Import backend modules (may fail if backend not set up)
        try:
            from app.database.database import SessionLocal
            from app.database.models import UserVideo
            from app.core.config import get_settings
        except ImportError as e:
            print(f"  ⚠ Could not import backend modules: {e}")
            print(f"  Make sure you're running from the project root and backend dependencies are installed")
            return False
        
        settings = get_settings()
        upload_dir = settings.UPLOAD_DIR
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy video to upload directory
        source_path = Path(video_info["final_path"])
        import uuid
        unique_filename = f"{uuid.uuid4()}{source_path.suffix}"
        dest_path = upload_dir / unique_filename
        
        print(f"  📤 Copying to backend storage...")
        shutil.copy2(source_path, dest_path)
        
        # Create relative URL
        video_url = f"/api/assets/videos/{unique_filename}"
        
        # Generate thumbnail URL if available
        thumbnail_url = None
        if video_info.get("thumbnail_path"):
            thumb_source = Path(video_info["thumbnail_path"])
            thumb_filename = f"{uuid.uuid4()}.jpg"
            thumb_dest = upload_dir / thumb_filename
            shutil.copy2(thumb_source, thumb_dest)
            thumbnail_url = f"/api/assets/videos/{thumb_filename}"
        
        # Create database entry
        db = SessionLocal()
        try:
            user_video = UserVideo(
                filename=unique_filename,
                original_filename=video_info["final_name"],
                video_url=video_url,
                thumbnail_url=thumbnail_url,
                duration_seconds=video_info.get("duration"),
                file_size=dest_path.stat().st_size,
                tags=video_info.get("tags", []),
                description=f"Stock video: {video_info['suggested_name']}",
            )
            
            db.add(user_video)
            db.commit()
            db.refresh(user_video)
            
            print(f"  ✓ Registered in database (ID: {user_video.id})")
            
            # Clean up original files from assets/ after successful upload
            cleanup_original_files(video_info)
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"  ✗ Failed to upload to backend: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main execution."""
    parser = argparse.ArgumentParser(description="Process stock videos: rename, compress, backup, and register")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode - no files will be modified")
    parser.add_argument("--auto-accept", action="store_true", help="Auto-accept suggested names without prompting")
    args = parser.parse_args()
    
    print("=" * 70)
    print("Stock Video Processor")
    print("=" * 70)
    
    # Check dependencies
    if not check_ffmpeg():
        print("✗ Error: ffmpeg is not installed or not in PATH")
        print("  Install with: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)")
        sys.exit(1)
    
    # Find video files
    print(f"\n📁 Scanning for videos in: {ASSETS_DIR}")
    video_files = list(ASSETS_DIR.glob("*.mp4")) + list(ASSETS_DIR.glob("*.mov"))
    
    if not video_files:
        print("  No video files found")
        sys.exit(0)
    
    print(f"  Found {len(video_files)} video file(s)")
    
    dry_run = args.dry_run
    auto_accept = args.auto_accept
    
    if dry_run:
        print("\n  (Dry run mode - no files will be modified)")
    if auto_accept:
        print("\n  (Auto-accept mode - using suggested names automatically)")
    
    # Process each video
    processed = []
    for video_file in video_files:
        try:
            result = process_video(video_file, dry_run=dry_run, auto_accept=auto_accept)
            if result:
                processed.append(result)
                
                # Upload to backend if not dry run
                if not dry_run:
                    upload_to_backend(result)
        except KeyboardInterrupt:
            print("\n\n⚠ Interrupted by user")
            break
        except Exception as e:
            print(f"  ✗ Error processing {video_file.name}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    # Summary
    print("\n" + "=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"  Processed: {len(processed)} video(s)")
    
    if processed:
        total_size = sum(p.get("file_size_mb", 0) for p in processed)
        print(f"  Total size: {total_size:.1f}MB")
        print(f"  Backups: {BACKUP_DIR}")
    
    if not dry_run:
        print(f"\n  ✓ Videos are now available in the asset search system")
        print(f"  ✓ They will be rotated based on use_count to prevent overuse")
    
    print("=" * 70)


if __name__ == "__main__":
    main()

