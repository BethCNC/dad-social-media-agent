"""Asset search API routes."""
from fastapi import APIRouter, HTTPException, Query
from app.models.video import AssetResult
from app.services.pexels_client import search_videos

router = APIRouter()


@router.get("/search", response_model=list[AssetResult])
async def search_assets(
    query: str = Query(..., description="Search query for stock videos"),
    max_results: int = Query(10, ge=1, le=80, description="Maximum number of results")
) -> list[AssetResult]:
    """
    Search for stock video assets.
    
    Args:
        query: Search query string
        max_results: Maximum number of results (1-80)
        
    Returns:
        List of AssetResult objects
    """
    try:
        return search_videos(query, max_results)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        ) from e
