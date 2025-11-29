"""Application configuration and settings management."""
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Find project root (where .env file is located)
# This file is in backend/app/core/, so go up 3 levels to project root
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    OPENAI_API_KEY: str
    PEXELS_API_KEY: str
    CREATOMATE_API_KEY: str
    CREATOMATE_IMAGE_TEMPLATE_ID: str
    CREATOMATE_VIDEO_TEMPLATE_ID: str
    AYRSHARE_API_KEY: str
    
    # Google Calendar (optional)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/google/callback"
    
    # Application settings
    FRONTEND_URL: str = "http://localhost:5173"
    ENV: str = "development"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

