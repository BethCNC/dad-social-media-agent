"""Schedule generation models."""
from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from app.models.content import ShotInstruction


class ScheduleRequest(BaseModel):
    """Request to generate a monthly schedule."""
    start_date: date  # First day of the month
    platforms: List[str] = ["TikTok", "Instagram"]
    posts_per_week: int = 5  # 3-7 posts per week (from playbook)
    content_mix: Optional[dict] = None  # Override default mix if needed


class ScheduledContentItem(BaseModel):
    """Single day's content suggestion."""
    date: date
    day_of_week: str
    content_pillar: str  # "education", "routine", "story", "product_integration"
    series_name: Optional[str] = None  # e.g., "Energy Tip Tuesday"
    topic: str
    hook: str  # First 1-3 seconds hook
    script: str
    caption: str
    shot_plan: List[ShotInstruction]
    suggested_keywords: List[str]  # For TikTok SEO
    template_type: str = "video"


class MonthlySchedule(BaseModel):
    """Complete monthly schedule with all content."""
    start_date: date
    end_date: date
    items: List[ScheduledContentItem]
    series_breakdown: dict  # Summary of series created

