# Stock Video Processing Guide

This guide explains how to process stock videos for use in the AI Social Media Co-Pilot.

## Overview

The `process_stock_videos.py` script helps you:
1. **Rename** videos with descriptive names
2. **Compress** large videos to reduce file size
3. **Backup** original files before processing
4. **Register** videos in the database so they're available in asset search
5. **Track usage** to prevent overusing the same videos

## Prerequisites

1. **ffmpeg** must be installed:
   ```bash
   # macOS
   brew install ffmpeg
   
   # Linux
   sudo apt-get install ffmpeg
   
   # Verify installation
   ffmpeg -version
   ```

2. **Backend dependencies** must be installed:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Database** must be initialized (run the backend at least once)

## Usage

### Basic Usage

```bash
cd /Users/bethcartrette/REPOS/unicity-agent
python scripts/process_stock_videos.py
```

### What the Script Does

1. **Scans** `frontend/src/assets/` for `.mp4` and `.mov` files
2. **Analyzes** each video:
   - File size
   - Duration
   - Video metadata (resolution, bitrate, etc.)
3. **Suggests** descriptive names based on filename patterns
4. **Asks** you to confirm or override the suggested name
5. **Creates backups** in `static/backups/videos/`
6. **Compresses** videos larger than 50MB (configurable)
7. **Generates thumbnails** for preview
8. **Uploads** to backend storage (`static/uploads/`)
9. **Registers** in database with tags and metadata

### Dry Run Mode

Test the script without making changes:

```bash
python scripts/process_stock_videos.py
# When prompted, type 'y' for dry run
```

### Configuration

Edit these variables in the script to customize behavior:

```python
MAX_FILE_SIZE_MB = 50  # Compress videos larger than this
TARGET_VIDEO_QUALITY = "medium"  # low, medium, or high
```

## Video Naming

The script suggests names based on filename patterns. You can:

1. **Accept** the suggested name (press Enter)
2. **Override** with your own name (type a new name)

Suggested names are converted to lowercase with hyphens (e.g., "hands-typing", "man-walking-sunset").

## Compression

Videos larger than 50MB are automatically compressed using ffmpeg:

- **Quality settings**:
  - `low`: CRF 28, fast preset (smallest file)
  - `medium`: CRF 23, medium preset (balanced)
  - `high`: CRF 20, slow preset (best quality)

- **Compression preserves**:
  - Video content
  - Audio track
  - Web optimization (fast start)

## Backup

Original files are backed up to `static/backups/videos/` before any processing. The original filename is preserved in the backup.

## Database Registration

After processing, videos are:

1. **Copied** to `static/uploads/` with a unique UUID filename
2. **Registered** in the `user_videos` table with:
   - Original filename
   - Video URL (served at `/api/assets/videos/{uuid}.mp4`)
   - Thumbnail URL (if generated)
   - Duration, file size
   - Tags (for searchability)
   - Description

## Usage Tracking

The system tracks video usage to prevent overuse:

- `use_count`: How many times the video has been selected
- `last_used_at`: When it was last used

The asset search service prioritizes videos with:
- Lower `use_count`
- Older `last_used_at` (or null)

This ensures videos are rotated fairly.

## Example Workflow

```bash
# 1. Add videos to frontend/src/assets/
cp ~/Downloads/stock-video.mp4 frontend/src/assets/

# 2. Run the processing script
python scripts/process_stock_videos.py

# 3. Review suggested names and confirm
#    - "stock-video" → press Enter to accept
#    - Or type "nature-scene" to override

# 4. Script processes:
#    ✓ Backup created
#    ✓ Video compressed (if needed)
#    ✓ Thumbnail generated
#    ✓ Registered in database

# 5. Videos are now available in asset search!
```

## Troubleshooting

### "ffmpeg is not installed"
Install ffmpeg (see Prerequisites above).

### "Failed to upload to backend"
- Make sure the backend database is initialized
- Check that `static/uploads/` directory exists and is writable
- Verify database connection settings

### "Compression didn't reduce size"
This can happen if the video is already well-compressed. The script will keep the original file.

### "Could not get duration"
The script will continue without duration metadata. You can manually update it in the database if needed.

## File Locations

- **Source videos**: `frontend/src/assets/*.mp4`, `*.mov`
- **Backups**: `static/backups/videos/`
- **Processed videos**: `static/uploads/` (with UUID filenames)
- **Thumbnails**: `static/uploads/` (with UUID filenames, `.jpg` extension)

## Next Steps

After processing videos:

1. **Test asset search** in the app - your videos should appear in search results
2. **Check video rotation** - videos with lower use_count should appear first
3. **Add more videos** - repeat the process to build your library

## Notes

- Videos are served at `/api/assets/videos/{filename}` by the FastAPI backend
- The system automatically includes user videos when searching for assets (in "pexels" mode)
- Videos are included in contextual asset search based on shot plan descriptions

