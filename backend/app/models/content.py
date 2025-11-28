"""Content generation models."""
from pydantic import BaseModel


class ContentBrief(BaseModel):
    """Input brief for content generation."""
    idea: str
    platforms: list[str]
    tone: str
    length_seconds: int | None = None


class ShotInstruction(BaseModel):
    """Instruction for a single video shot."""
    description: str
    duration_seconds: int


class GeneratedPlan(BaseModel):
    """Generated content plan with script, caption, and shot plan."""
    script: str
    caption: str
    shot_plan: list[ShotInstruction]

