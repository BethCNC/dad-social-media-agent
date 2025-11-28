"""Application configuration and settings management."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    OPENAI_API_KEY: str
    PEXELS_API_KEY: str
    CREATOMATE_API_KEY: str
    AYRSHARE_API_KEY: str
    
    # Application settings
    FRONTEND_URL: str = "http://localhost:5173"
    ENV: str = "development"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

