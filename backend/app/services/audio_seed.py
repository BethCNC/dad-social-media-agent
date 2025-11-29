"""Seed a small set of CC0 / royalty-free audio tracks.

NOTE: The concrete `file_url` values here are placeholders. You should update them
to point to real, licensed audio files (for example, Creatomate assets or files
hosted on your own storage) before using in production.
"""

import logging
from sqlalchemy.orm import Session

from app.database.models import AudioTrack

logger = logging.getLogger(__name__)


def seed_audio_tracks(db: Session) -> int:
    """Seed a small library of audio tracks if none exist.

    Returns:
        Number of tracks created (0 if already seeded).
    """
    existing_count = db.query(AudioTrack).count()
    if existing_count > 0:
        logger.info("Audio tracks already seeded, skipping.")
        return 0

    # TODO: VERIFY: Replace placeholder URLs with real CC0 / royalty-free audio files.
    tracks = [
        AudioTrack(
            title="Calm Morning Focus",
            mood="calm",
            tempo="slow",
            length_seconds=120,
            source="local_cc0_library",
            source_id="calm_morning_focus_01",
            file_url="https://example.com/audio/calm_morning_focus_01.mp3",
            license_type="CC0",
            license_notes="TODO: VERIFY license and hosting before production use.",
        ),
        AudioTrack(
            title="Energetic Motivation",
            mood="energetic",
            tempo="fast",
            length_seconds=90,
            source="local_cc0_library",
            source_id="energetic_motivation_01",
            file_url="https://example.com/audio/energetic_motivation_01.mp3",
            license_type="CC0",
            license_notes="TODO: VERIFY license and hosting before production use.",
        ),
        AudioTrack(
            title="Warm Inspirational",
            mood="inspirational",
            tempo="medium",
            length_seconds=150,
            source="local_cc0_library",
            source_id="warm_inspirational_01",
            file_url="https://example.com/audio/warm_inspirational_01.mp3",
            license_type="CC0",
            license_notes="TODO: VERIFY license and hosting before production use.",
        ),
    ]

    for track in tracks:
        db.add(track)

    db.commit()
    logger.info(f"Seeded {len(tracks)} audio tracks.")
    return len(tracks)


