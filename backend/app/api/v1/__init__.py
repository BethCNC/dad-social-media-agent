"""API v1 router aggregation."""
from fastapi import APIRouter

from . import assets, content, social, video, schedule, weekly, holidays, trends, dashboard, bank, settings, knowledge

api_router = APIRouter()

api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(bank.router, prefix="/content", tags=["content-bank"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(video.router, prefix="/video", tags=["video"])
api_router.include_router(social.router, prefix="/social", tags=["social"])
api_router.include_router(schedule.router, prefix="/schedule", tags=["schedule"])
api_router.include_router(weekly.router, prefix="/weekly", tags=["weekly"])
api_router.include_router(holidays.router, prefix="/holidays", tags=["holidays"])
api_router.include_router(trends.router, prefix="/trends", tags=["trends"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])

