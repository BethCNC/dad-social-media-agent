"""Application configuration and settings management."""
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.models.audio import AudioMode

# Find project root (where .env file is located for local development)
# This file is in backend/app/core/, so go up 3 levels to project root
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    GOOGLE_API_KEY: str
    CREATOMATE_API_KEY: str
    CREATOMATE_IMAGE_TEMPLATE_ID: str
    CREATOMATE_VIDEO_TEMPLATE_ID: str
    AYRSHARE_API_KEY: str
    APIFY_API_TOKEN: str = ""  # Optional: For trend surveillance feature
    
    # Optional: Default background music for Creatomate videos
    CREATOMATE_DEFAULT_MUSIC: str = ""  # URL to music file (Creatomate asset or external URL)

    # Optional: Text-to-speech configuration for voiceover generation
    TTS_API_URL: str | None = None  # Base URL of TTS endpoint returning {"audio_url": "https://..."}
    TTS_API_KEY: str | None = None  # API key or bearer token, if required
    TTS_VOICE_ID: str | None = None  # Provider-specific voice identifier
    
    # Application settings
    FRONTEND_URL: str = "http://localhost:5173"
    ENV: str = "development"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    API_BASE_URL: str = "http://localhost:8000"  # For constructing public URLs
    
    # Audio system settings
    AUDIO_MODE: str = AudioMode.AUTO_STOCK_WITH_TIKTOK_HINTS.value
    
    # File upload settings (computed property)
    @property
    def UPLOAD_DIR(self) -> Path:
        """Get the upload directory path for generated images."""
        upload_dir = PROJECT_ROOT / "static" / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir
    
    model_config = SettingsConfigDict(
        # Load from .env file if present (local dev), otherwise use environment variables (production)
        # Use absolute path to project root .env file for local development
        # If the file doesn't exist, pydantic-settings will silently fall back to environment variables
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        # Ignore extra fields in .env file that aren't defined in Settings
        extra="ignore",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance.
    
    Loads settings from:
    - .env file in project root (if present, for local development)
    - Environment variables (for production/Docker)
    
    If required fields are missing, Pydantic will raise ValidationError.
    """
    return Settings()

