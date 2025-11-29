#!/usr/bin/env python3
"""Fetch and process CC0 audio tracks from SoundSafari/CC0-1.0-Music dataset.

This script:
1. Clones the CC0-1.0-Music dataset to /tmp/cc0-music-dataset
2. Selects 10-20 appropriate background music tracks
3. Copies them to frontend/public/audio/placeholders/
4. Renames them with mood-friendly names
5. Generates metadata JSON structure
"""

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Try to import mutagen for audio metadata, fallback to estimation
try:
    from mutagen.mp3 import MP3
    from mutagen.wave import WAVE
    HAS_MUTAGEN = True
except ImportError:
    HAS_MUTAGEN = False
    print("Warning: mutagen not installed. Will estimate audio lengths.")


# Project root (parent of scripts/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
TEMP_DATASET_DIR = Path("/tmp/cc0-music-dataset")
TARGET_DIR = PROJECT_ROOT / "frontend" / "public" / "audio" / "placeholders"
METADATA_FILE = PROJECT_ROOT / "backend" / "app" / "data" / "audio_tracks.json"

# Mood categories and their target counts
MOOD_DISTRIBUTION = {
    "calm": 4,
    "energetic": 4,
    "inspirational": 3,
    "upbeat": 3,
    "peaceful": 2,
}

# Tempo mapping based on mood
MOOD_TO_TEMPO = {
    "calm": "slow",
    "energetic": "fast",
    "inspirational": "medium",
    "upbeat": "fast",
    "peaceful": "slow",
}


def clone_dataset() -> bool:
    """Clone the CC0-1.0-Music dataset to /tmp."""
    if TEMP_DATASET_DIR.exists():
        print(f"Dataset already exists at {TEMP_DATASET_DIR}")
        response = input("Delete and re-clone? (y/N): ").strip().lower()
        if response == 'y':
            shutil.rmtree(TEMP_DATASET_DIR)
        else:
            return True
    
    print("Cloning CC0-1.0-Music dataset (this may take a while)...")
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", 
             "https://github.com/SoundSafari/CC0-1.0-Music.git", 
             str(TEMP_DATASET_DIR)],
            check=True,
            capture_output=True
        )
        print("✓ Dataset cloned successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to clone dataset: {e}")
        return False


def get_audio_duration(file_path: Path) -> Optional[int]:
    """Get audio file duration in seconds."""
    if not HAS_MUTAGEN:
        return None
    
    try:
        if file_path.suffix.lower() == '.mp3':
            audio = MP3(file_path)
        elif file_path.suffix.lower() == '.wav':
            audio = WAVE(file_path)
        else:
            return None
        return int(audio.info.length)
    except Exception:
        return None


def find_audio_files(dataset_dir: Path) -> List[Path]:
    """Find all audio files in the dataset."""
    audio_files = []
    extensions = {'.mp3', '.wav'}
    
    # Prefer these subdirectories for background music
    preferred_dirs = ['freepd.com', 'chosic.com', 'freemusicarchive.org']
    
    for subdir in preferred_dirs:
        subdir_path = dataset_dir / subdir
        if subdir_path.exists():
            for ext in extensions:
                audio_files.extend(subdir_path.rglob(f'*{ext}'))
            if len(audio_files) >= 50:  # Enough to choose from
                break
    
    # If not enough, search all directories
    if len(audio_files) < 20:
        for ext in extensions:
            audio_files.extend(dataset_dir.rglob(f'*{ext}'))
    
    return audio_files


def select_tracks(audio_files: List[Path]) -> List[Dict]:
    """Select appropriate tracks based on criteria."""
    selected = []
    mood_counts = {mood: 0 for mood in MOOD_DISTRIBUTION.keys()}
    
    # Filter files by size (< 10 MB) and get metadata
    candidates = []
    for file_path in audio_files:
        try:
            size_mb = file_path.stat().st_size / (1024 * 1024)
            if size_mb > 10:
                continue
            
            duration = get_audio_duration(file_path)
            # Prefer tracks between 30-180 seconds, but accept up to 300
            if duration and (duration < 30 or duration > 300):
                continue
            
            candidates.append({
                'path': file_path,
                'size_mb': size_mb,
                'duration': duration or 120,  # Default estimate
                'original_name': file_path.name,
                'source_dir': file_path.parent.name,
            })
        except Exception as e:
            continue
    
    # Sort by duration (prefer medium-length tracks)
    candidates.sort(key=lambda x: abs(x['duration'] - 120))
    
    # Select tracks for each mood
    for mood, target_count in MOOD_DISTRIBUTION.items():
        for candidate in candidates:
            if mood_counts[mood] >= target_count:
                break
            
            # Simple heuristic: assign based on filename/keywords
            filename_lower = candidate['original_name'].lower()
            mood_keywords = {
                'calm': ['calm', 'ambient', 'peaceful', 'soft', 'gentle'],
                'energetic': ['energetic', 'upbeat', 'fast', 'pump', 'drive'],
                'inspirational': ['inspirational', 'motivational', 'uplifting', 'inspiring'],
                'upbeat': ['happy', 'cheerful', 'joyful', 'bright', 'upbeat'],
                'peaceful': ['peaceful', 'meditation', 'zen', 'tranquil', 'serene'],
            }
            
            # Check if filename matches mood keywords
            matches_mood = any(kw in filename_lower for kw in mood_keywords.get(mood, []))
            
            # If we're running low on candidates, be more lenient
            if matches_mood or len(candidates) < 30:
                track_id = f"{mood}-{mood_counts[mood] + 1:02d}"
                selected.append({
                    **candidate,
                    'mood': mood,
                    'track_id': track_id,
                })
                mood_counts[mood] += 1
                candidates.remove(candidate)
    
    return selected


def copy_and_rename_tracks(selected_tracks: List[Dict]) -> List[Dict]:
    """Copy tracks to target directory with mood-friendly names."""
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    
    processed = []
    for track in selected_tracks:
        # Generate filename
        ext = track['path'].suffix.lower()
        new_filename = f"{track['track_id']}{ext}"
        target_path = TARGET_DIR / new_filename
        
        # Copy file
        try:
            shutil.copy2(track['path'], target_path)
            print(f"✓ Copied: {new_filename}")
            
            processed.append({
                'id': track['track_id'],
                'title': track['track_id'].replace('-', ' ').title(),
                'mood': track['mood'],
                'tempo': MOOD_TO_TEMPO[track['mood']],
                'length_seconds': track['duration'],
                'source': 'SoundSafari-CC0',
                'source_id': f"{track['source_dir']}/{track['original_name']}",
                'file_url': f"/audio/placeholders/{new_filename}",
                'license_type': 'CC0',
                'license_notes': 'CC0-1.0 public domain from SoundSafari/CC0-1.0-Music',
            })
        except Exception as e:
            print(f"✗ Failed to copy {track['path']}: {e}")
    
    return processed


def generate_metadata(tracks: List[Dict]) -> None:
    """Generate audio_tracks.json metadata file."""
    METADATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    with open(METADATA_FILE, 'w') as f:
        json.dump(tracks, f, indent=2)
    
    print(f"✓ Generated metadata: {METADATA_FILE}")


def main():
    """Main execution."""
    print("=" * 60)
    print("CC0 Audio Track Fetcher")
    print("=" * 60)
    
    # Clone dataset
    if not clone_dataset():
        sys.exit(1)
    
    # Find audio files
    print("\nScanning for audio files...")
    audio_files = find_audio_files(TEMP_DATASET_DIR)
    print(f"Found {len(audio_files)} audio files")
    
    if len(audio_files) < 20:
        print("⚠ Warning: Not enough audio files found")
    
    # Select tracks
    print("\nSelecting tracks...")
    selected = select_tracks(audio_files)
    print(f"Selected {len(selected)} tracks")
    
    # Copy and rename
    print("\nCopying tracks to frontend/public/audio/placeholders/...")
    processed = copy_and_rename_tracks(selected)
    
    # Generate metadata
    print("\nGenerating metadata...")
    generate_metadata(processed)
    
    print("\n" + "=" * 60)
    print(f"✓ Successfully processed {len(processed)} tracks")
    print(f"  - Files: {TARGET_DIR}")
    print(f"  - Metadata: {METADATA_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()

