"""Social media scheduling models."""
from datetime import datetime
from pydantic import BaseModel


class ScheduleRequest(BaseModel):
    """Request to schedule a social media post."""
    video_url: str
    caption: str
    platforms: list[str]
    scheduled_time: datetime | None = None


class ScheduleResponse(BaseModel):
    """Response from scheduling a post."""
    provider_id: str
    status: str
    external_links: list[str] | None = None

