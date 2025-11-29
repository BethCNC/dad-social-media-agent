"""SQLAlchemy models for content database and schedules."""
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Time, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base


class ContentQuote(Base):
    """Quotes and messaging from Unicity materials."""
    __tablename__ = "content_quotes"

    id = Column(Integer, primary_key=True, index=True)
    quote_text = Column(Text, nullable=False)
    source = Column(String(255), nullable=False)  # e.g., "Feel Great System", "Unimate Product Page"
    category = Column(String(100), nullable=False)  # e.g., "energy", "metabolism", "wellness", "product_benefit"
    product_reference = Column(String(50), nullable=True)  # e.g., "feel_great", "unimate", "balance"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ContentTemplate(Base):
    """Reusable content templates."""
    __tablename__ = "content_templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    template_text = Column(Text, nullable=False)
    content_pillar = Column(String(50), nullable=False)  # education, routine, story, product_integration
    use_case = Column(String(100), nullable=False)  # e.g., "morning_routine", "energy_tip", "product_intro"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Holiday(Base):
    """US holidays for content planning."""
    __tablename__ = "holidays"

    id = Column(String(36), primary_key=True, index=True)  # UUID as string
    date = Column(Date, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    source = Column(String(100), nullable=False, default="google_us_holidays")
    category = Column(String(50), nullable=True)  # e.g., "public_holiday", "observance"
    is_marketing_relevant = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class WeeklySchedule(Base):
    """Generated weekly schedules."""
    __tablename__ = "weekly_schedules"

    id = Column(Integer, primary_key=True, index=True)
    week_start_date = Column(Date, nullable=False, index=True)
    user_id = Column(String(100), nullable=True)  # For future multi-user support
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="draft", nullable=False)  # draft, approved, scheduled

    # Relationship to posts
    posts = relationship("ScheduledPost", back_populates="schedule", cascade="all, delete-orphan")


class ScheduledPost(Base):
    """Individual posts in a weekly schedule."""
    __tablename__ = "scheduled_posts"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("weekly_schedules.id"), nullable=False)
    post_date = Column(Date, nullable=False, index=True)
    post_time = Column(Time, nullable=True)
    content_pillar = Column(String(50), nullable=False)  # education, routine, story, product_integration
    series_name = Column(String(255), nullable=True)
    topic = Column(String(255), nullable=False)
    hook = Column(Text, nullable=False)
    script = Column(Text, nullable=False)
    caption = Column(Text, nullable=False)
    template_type = Column(String(20), nullable=False)  # "image" or "video"
    shot_plan = Column(JSON, nullable=True)  # Store as JSON array of ShotInstruction
    suggested_keywords = Column(JSON, nullable=True)  # Store as JSON array of strings
    media_url = Column(String(500), nullable=True)  # Rendered video/image URL
    # Audio metadata for rendered videos
    audio_track_id = Column(Integer, ForeignKey("audio_tracks.id"), nullable=True)
    audio_music_mood = Column(String(50), nullable=True)
    tiktok_music_hints = Column(JSON, nullable=True)  # Store as JSON array of TikTokMusicHint dicts
    status = Column(String(50), default="draft", nullable=False)  # draft, ready, scheduled, published
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to schedule
    schedule = relationship("WeeklySchedule", back_populates="posts")


class UserVideo(Base):
    """User-uploaded B-roll and background footage."""
    __tablename__ = "user_videos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    video_url = Column(String(500), nullable=False)  # URL to stored video file
    thumbnail_url = Column(String(500), nullable=True)  # Optional thumbnail URL
    duration_seconds = Column(Integer, nullable=True)  # Video duration if available
    file_size = Column(Integer, nullable=True)  # File size in bytes
    tags = Column(JSON, nullable=True)  # Array of tags for searchability
    description = Column(Text, nullable=True)  # Optional description
    use_count = Column(Integer, default=0, nullable=False)  # Track how many times used
    last_used_at = Column(DateTime, nullable=True)  # Last time this video was selected
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AudioTrack(Base):
    """Background music tracks (CC0 / royalty-free) used in rendered videos."""
    __tablename__ = "audio_tracks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    mood = Column(String(50), nullable=False)  # e.g., calm, energetic, inspirational
    tempo = Column(String(50), nullable=True)  # e.g., slow, medium, fast
    length_seconds = Column(Integer, nullable=False)
    source = Column(String(100), nullable=False)  # e.g., freesound_cc0, local_library
    source_id = Column(String(255), nullable=False)  # external ID or path for debugging
    file_url = Column(String(500), nullable=False)  # Public URL accessible by Creatomate
    license_type = Column(String(50), nullable=False, default="CC0")
    license_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
