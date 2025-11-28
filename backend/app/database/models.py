"""SQLAlchemy models for content database and schedules."""
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Time, ForeignKey, JSON
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
    status = Column(String(50), default="draft", nullable=False)  # draft, ready, scheduled, published
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to schedule
    schedule = relationship("WeeklySchedule", back_populates="posts")

