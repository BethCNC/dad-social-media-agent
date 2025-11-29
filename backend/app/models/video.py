"""Video rendering models."""
from pydantic import BaseModel


class AssetResult(BaseModel):
    """Result from asset search."""
    id: str
    thumbnail_url: str
    video_url: str
    duration_seconds: int


class AssetSelection(BaseModel):
    """Selected asset with optional timing."""
    id: str
    start_at: float | None = None
    end_at: float | None = None


class VideoRenderRequest(BaseModel):
    """Request to render a video or image."""
    assets: list[AssetSelection]
    script: str
    title: str | None = None
    template_type: str = "video"  # "image" or "video"
    # Optional background music URL to use for Music.source in Creatomate template
    music_url: str | None = None


class RenderJob(BaseModel):
    """Video rendering job status."""
    job_id: str
    status: str
    video_url: str | None = None

