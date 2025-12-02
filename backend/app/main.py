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
from app.database.database import init_db, SessionLocal
from app.services.holiday_service import sync_us_holidays
from app.services.audio_seed import seed_audio_tracks

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

    # Seed audio tracks (idempotent)
    try:
        db = SessionLocal()
        created = seed_audio_tracks(db)
        if created:
            logger.info(f"Seeded {created} audio tracks.")
    except Exception as e:
        logger.warning(f"Failed to seed audio tracks: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass
    
    # Log Creatomate template configuration
    logger.info("=" * 60)
    logger.info("Creatomate Template Configuration:")
    logger.info(f"  Image Template ID: {settings.CREATOMATE_IMAGE_TEMPLATE_ID}")
    logger.info(f"  Video Template ID: {settings.CREATOMATE_VIDEO_TEMPLATE_ID}")
    logger.info("=" * 60)
    
    # Sync holidays in background (non-blocking)
    # This ensures holidays are available but doesn't block startup if it fails
    async def sync_holidays_background():
        try:
            logger.info("Syncing US holidays...")
            count = await sync_us_holidays()
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
    """Health check endpoint with external API connectivity checks.
    
    Returns basic status and optionally checks external API reachability
    for production monitoring.
    """
    import httpx
    
    status = {"status": "healthy", "version": "1.0.0"}
    
    # In production, optionally check external API connectivity
    if settings.ENV == "production":
        checks = {}
        
        # Check Creatomate API
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    "https://api.creatomate.com/v2/renders",
                    headers={"Authorization": f"Bearer {settings.CREATOMATE_API_KEY}"},
                )
                checks["creatomate"] = "reachable" if response.status_code in [200, 401, 403] else "error"
        except Exception:
            checks["creatomate"] = "unreachable"
        
        # Check Pexels API
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    "https://api.pexels.com/videos/search?query=test&per_page=1",
                    headers={"Authorization": settings.PEXELS_API_KEY},
                )
                checks["pexels"] = "reachable" if response.status_code in [200, 401, 403] else "error"
        except Exception:
            checks["pexels"] = "unreachable"
        
        status["external_apis"] = checks
    
    return status

# Mount static directory for serving generated images and frontend
static_dir = settings.UPLOAD_DIR.parent  # static/ directory
static_dir.mkdir(parents=True, exist_ok=True)

# Mount static files directory (for generated images and frontend)
# Add CORS headers middleware for static files
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware

class StaticFilesWithCORS(StaticFiles):
    """StaticFiles with CORS headers to allow ngrok image access."""
    async def __call__(self, scope, receive, send):
        # Add CORS headers for image requests
        if scope["type"] == "http":
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    headers = dict(message.get("headers", []))
                    headers[b"access-control-allow-origin"] = b"*"
                    headers[b"access-control-allow-methods"] = b"GET, OPTIONS"
                    headers[b"access-control-allow-headers"] = b"*"
                    message["headers"] = list(headers.items())
                await send(message)
            await super().__call__(scope, receive, send_wrapper)
        else:
            await super().__call__(scope, receive, send)

if static_dir.exists():
    app.mount("/static", StaticFilesWithCORS(directory=str(static_dir)), name="static")

# Mount uploads subdirectory for serving user-uploaded videos
from pathlib import Path
uploads_dir = settings.UPLOAD_DIR
uploads_dir.mkdir(parents=True, exist_ok=True)
if uploads_dir.exists():
    app.mount("/api/assets/videos", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Mount static files if they exist (for production frontend)
prod_static_dir = "/app/static"
if os.path.exists(prod_static_dir):
    # Catch-all route for React Router (serve index.html for all non-API routes)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve React app for all non-API routes."""
        # Exclude API routes, health endpoint, and static files
        if full_path.startswith("api") or full_path == "health" or full_path.startswith("static"):
            return {"error": "Not found"}
        index_path = os.path.join(prod_static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Not found"}

