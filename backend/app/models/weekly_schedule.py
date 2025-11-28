"""Weekly schedule models."""
from typing import List, Optional, Dict
from datetime import date, time
from pydantic import BaseModel
from app.models.content import ShotInstruction


class WeeklyScheduleRequest(BaseModel):
    """Request to generate a weekly schedule."""
    week_start_date: date  # Monday of the week
    platforms: List[str] = ["TikTok", "Instagram"]


class WeeklyPost(BaseModel):
    """Single post in weekly schedule."""
    post_date: date
    post_time: Optional[time] = None  # Optional specific time
    content_pillar: str  # education, routine, story, product_integration
    series_name: Optional[str] = None
    topic: str
    hook: str
    script: str
    caption: str
    template_type: str  # "image" or "video" - AI decides
    shot_plan: List[ShotInstruction]
    suggested_keywords: List[str]
    status: str = "draft"
    id: Optional[int] = None  # For posts loaded from database
    media_url: Optional[str] = None  # Rendered video/image URL


class WeeklySchedule(BaseModel):
    """Complete weekly schedule."""
    week_start_date: date
    week_end_date: date
    posts: List[WeeklyPost]
    series_breakdown: Dict[str, int]  # Summary of series created
    id: Optional[int] = None  # For schedules loaded from database
    status: Optional[str] = None  # draft, approved, scheduled

