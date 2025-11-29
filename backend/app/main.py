"""FastAPI application entry point."""
import os
import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.api.v1 import api_router
from app.database.database import init_db
from app.services.holiday_service import sync_us_holidays

settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Social Media Co-Pilot",
    description="Backend API for AI Social Media Co-Pilot",
    version="1.0.0",
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables and sync holidays on application startup."""
    init_db()
    
    # Sync holidays in background (non-blocking)
    # This ensures holidays are available but doesn't block startup if it fails
    async def sync_holidays_background():
        try:
            logger.info("Syncing US holidays...")
            count = sync_us_holidays()
            logger.info(f"Successfully synced {count} holidays")
        except Exception as e:
            logger.warning(f"Failed to sync holidays on startup (will retry on next request): {e}")
    
    # Run holiday sync in background
    asyncio.create_task(sync_holidays_background())

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL] if settings.ENV == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

# Mount static files if they exist (for production)
static_dir = "/app/static"
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    # Catch-all route for React Router (serve index.html for all non-API routes)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve React app for all non-API routes."""
        # Exclude API routes and health endpoint
        if full_path.startswith("api") or full_path == "health":
            return {"error": "Not found"}
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Not found"}

