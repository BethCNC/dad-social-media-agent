"""Audio selection service.

Responsible for selecting an appropriate background AudioTrack for a post
based on mood and approximate video length, respecting AudioMode.
"""

import logging
import random
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database.models import AudioTrack
from app.models.audio import AudioMode

logger = logging.getLogger(__name__)


def _get_audio_mode() -> AudioMode:
    """Parse AUDIO_MODE from settings with safe default."""
    settings = get_settings()
    mode_str = getattr(settings, "AUDIO_MODE", AudioMode.AUTO_STOCK_WITH_TIKTOK_HINTS.value)
    try:
        return AudioMode(mode_str)
    except ValueError:
        logger.warning(f"Invalid AUDIO_MODE '{mode_str}', defaulting to AUTO_STOCK_WITH_TIKTOK_HINTS")
        return AudioMode.AUTO_STOCK_WITH_TIKTOK_HINTS


def pick_track_for_plan(
    *,
    music_mood: Optional[str],
    estimated_length_seconds: int,
    db: Session,
) -> Optional[AudioTrack]:
    """Pick an AudioTrack for a plan based on mood and estimated length.

    Args:
        music_mood: Desired mood (e.g., \"calm\", \"energetic\"), case-insensitive. Can be None.
        estimated_length_seconds: Approximate video duration in seconds.
        db: Database session.

    Returns:
        Selected AudioTrack or None if muted or no tracks available.
    """
    mode = _get_audio_mode()
    if mode == AudioMode.MUTED_FOR_PLATFORM_MUSIC:
        logger.info("AudioMode=MUTED_FOR_PLATFORM_MUSIC; not selecting background track.")
        return None

    # Fetch tracks, preferring mood match and sufficient length
    query = db.query(AudioTrack)

    normalized_mood = (music_mood or "").strip().lower()
    if normalized_mood:
        query = query.filter(AudioTrack.mood == normalized_mood)

    tracks = query.all()

    # Fallback: if no tracks for this mood, ignore mood filter
    if not tracks and normalized_mood:
        logger.info(f"No audio tracks found for mood '{normalized_mood}', falling back to any mood.")
        tracks = db.query(AudioTrack).all()

    if not tracks:
        logger.warning("No audio tracks available; videos will render without background music.")
        return None

    # Prefer tracks with length >= estimated_length_seconds
    suitable = [t for t in tracks if t.length_seconds >= estimated_length_seconds]
    if not suitable:
        suitable = tracks

    # Randomize to avoid using the same track every time
    selected = random.choice(suitable)
    logger.info(
        f"Selected audio track '{selected.title}' (mood={selected.mood}, length={selected.length_seconds}s)"
    )

    return selected


