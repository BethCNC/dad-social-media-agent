"""Content generation API routes."""
from fastapi import APIRouter, HTTPException
from app.models.content import ContentBrief, GeneratedPlan
from app.services.content_service import create_content_plan

router = APIRouter()


@router.post("/plan", response_model=GeneratedPlan)
async def create_plan(brief: ContentBrief) -> GeneratedPlan:
    """
    Generate content plan from brief.
    
    Args:
        brief: Content brief with idea, platforms, tone, and optional length
        
    Returns:
        GeneratedPlan with script, caption, and shot plan
    """
    return create_content_plan(brief)
