"""API v1 router aggregation."""
from fastapi import APIRouter

from . import assets, content, social, video, schedule

api_router = APIRouter()

api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(video.router, prefix="/video", tags=["video"])
api_router.include_router(social.router, prefix="/social", tags=["social"])
api_router.include_router(schedule.router, prefix="/schedule", tags=["schedule"])

