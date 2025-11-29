"""Application configuration and settings management."""
import os
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.models.audio import AudioMode

# Find project root (where .env file is located)
# This file is in backend/app/core/, so go up 3 levels to project root
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"

# Load .env file using python-dotenv (this handles empty files gracefully)
# If .env file exists and has content, load it. Otherwise, rely on system environment variables.
if ENV_FILE.exists() and ENV_FILE.stat().st_size > 0:
    load_dotenv(dotenv_path=ENV_FILE, override=False)
else:
    # .env file is empty or doesn't exist - try to load from system environment
    # This allows users to set environment variables directly instead of using .env file
    load_dotenv(override=False)


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
        # Don't specify env_file here - we load it manually with load_dotenv above
        # This allows us to load from .env file OR system environment variables
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    try:
        return Settings()
    except Exception as e:
        # Provide helpful error message if .env file is empty or missing
        if ENV_FILE.exists() and ENV_FILE.stat().st_size == 0:
            raise ValueError(
                f"Your .env file at {ENV_FILE} is empty. "
                "Please add your API keys to the .env file. "
                "See .env.example for the required format."
            ) from e
        elif not ENV_FILE.exists():
            raise ValueError(
                f"Your .env file at {ENV_FILE} does not exist. "
                "Please create it with your API keys. "
                "See .env.example for the required format."
            ) from e
        else:
            raise ValueError(
                f"Failed to load settings. Missing required environment variables. "
                f"Please check your .env file at {ENV_FILE} contains all required keys."
            ) from e

