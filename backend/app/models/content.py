"""Content generation models."""
from pydantic import BaseModel
from typing import Optional


class ContentBrief(BaseModel):
    """Input brief for content generation."""
    # Mode: "manual" = user provides topic, "auto" = AI suggests topic
    mode: str = "manual"  # "manual" or "auto"
    
    # For manual mode: user provides their own topic
    user_topic: Optional[str] = None
    
    # For auto mode: use holidays to suggest topics
    use_holidays: bool = False
    selected_holiday_id: Optional[str] = None
    
    # Legacy field: kept for backward compatibility (maps to user_topic when mode="manual")
    idea: Optional[str] = None
    
    platforms: list[str]
    tone: str = "friendly"
    length_seconds: int | None = None
    template_type: str = "video"  # "image" or "video"
    
    # Optional: target date for content (used for holiday context)
    target_date: Optional[str] = None  # ISO date string (YYYY-MM-DD)


class ShotInstruction(BaseModel):
    """Instruction for a single video shot."""
    description: str
    duration_seconds: int


class GeneratedPlan(BaseModel):
    """Generated content plan with script, caption, and shot plan."""
    script: str
    caption: str
    shot_plan: list[ShotInstruction]

