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
    
    # Optional: image bytes for multimodal content generation (inspiration image)
    # Note: This is handled separately in the API endpoint via file upload


class ShotInstruction(BaseModel):
    """Instruction for a single video shot."""
    description: str
    duration_seconds: int


class TikTokMusicHint(BaseModel):
    """Text-based suggestion for what to search for in TikTok's music picker."""
    label: str
    searchPhrase: str
    mood: Optional[str] = None


class GeneratedPlan(BaseModel):
    """Generated content plan with script, caption, shot plan, and audio hints."""
    script: str
    caption: str
    shot_plan: list[ShotInstruction]
    # Music mood for background track selection
    music_mood: Optional[str] = None  # e.g., calm, energetic, inspirational, serious, fun
    # TikTok music search suggestions for the user to copy
    tiktok_music_hints: list[TikTokMusicHint] = []

