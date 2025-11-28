"""Content generation service."""
import logging
from fastapi import HTTPException
from app.models.content import ContentBrief, GeneratedPlan
from app.services.openai_client import generate_content_plan

logger = logging.getLogger(__name__)


def create_content_plan(brief: ContentBrief) -> GeneratedPlan:
    """
    Create content plan from brief.
    
    Args:
        brief: Content brief
        
    Returns:
        GeneratedPlan with script, caption, and shot plan
        
    Raises:
        HTTPException: If content generation fails
    """
    try:
        return generate_content_plan(brief)
    except ValueError as e:
        logger.error(f"Content generation validation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your content plan. Please try again with a different idea."
        ) from e
    except Exception as e:
        logger.error(f"Content generation error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your content plan right now. Please try again in a few minutes."
        ) from e

