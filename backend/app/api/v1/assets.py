"""Asset search API routes."""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, List
from pydantic import BaseModel
from app.models.video import AssetResult
from app.services.pexels_client import search_videos
from app.services.asset_search_service import search_relevant_assets

router = APIRouter()


class ContextualSearchRequest(BaseModel):
    """Request for context-aware asset search."""
    topic: str
    hook: str
    script: str
    shot_plan: List[dict]  # List of {"description": str, "duration_seconds": int}
    content_pillar: str
    suggested_keywords: Optional[List[str]] = None
    max_results: int = 12


@router.get("/search", response_model=list[AssetResult])
async def search_assets(
    query: str = Query(..., description="Search query for stock videos"),
    max_results: int = Query(10, ge=1, le=80, description="Maximum number of results")
) -> list[AssetResult]:
    """
    Simple search for stock video assets (backward compatible).
    
    Args:
        query: Search query string
        max_results: Maximum number of results (1-80)
        
    Returns:
        List of AssetResult objects
    """
    try:
        return await search_videos(query, max_results)
    except Exception as e:
        error_message = str(e) if str(e) else "We couldn't search for videos. Please try again."
        raise HTTPException(
            status_code=500,
            detail=error_message
        ) from e


@router.post("/search/contextual", response_model=list[AssetResult])
async def search_assets_contextual(
    request: ContextualSearchRequest = Body(...)
) -> list[AssetResult]:
    """
    Context-aware search for stock video assets using post content.
    
    Uses topic, hook, script, shot plan, content pillar, and suggested keywords
    to find the most relevant assets through multiple search strategies.
    
    Args:
        request: ContextualSearchRequest with post content details
        
    Returns:
        List of AssetResult objects, sorted by relevance
    """
    try:
        return await search_relevant_assets(
            topic=request.topic,
            hook=request.hook,
            script=request.script,
            shot_plan=request.shot_plan,
            content_pillar=request.content_pillar,
            suggested_keywords=request.suggested_keywords,
            max_results=request.max_results
        )
    except Exception as e:
        error_message = str(e) if str(e) else "We couldn't search for videos. Please try again."
        raise HTTPException(
            status_code=500,
            detail=error_message
        ) from e
