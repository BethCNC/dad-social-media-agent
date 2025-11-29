"""Content generation API routes."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from app.models.content import ContentBrief, GeneratedPlan
from app.services.content_service import create_content_plan
import json

router = APIRouter()


@router.post("/plan", response_model=GeneratedPlan)
async def create_plan(
    brief_json: str = Form(...),
    image: Optional[UploadFile] = File(None)
) -> GeneratedPlan:
    """
    Generate content plan from brief.
    
    This endpoint generates a script, caption, and shot plan for TikTok/Instagram
    content that is on-brand for Unicity and compliant with all rules in the
    client profile.
    
    Supports multimodal input: if an image is uploaded, it will be used to ground
    the script generation (e.g., inspiration image).
    
    Args:
        brief_json: JSON string of ContentBrief with idea, platforms, tone, and optional length
        image: Optional image file for multimodal content generation
        
    Returns:
        GeneratedPlan with script, caption, and shot plan
        
    Raises:
        HTTPException: If content generation fails
    """
    try:
        # Parse JSON brief
        brief_data = json.loads(brief_json)
        brief = ContentBrief(**brief_data)
        
        # Read image bytes if provided
        image_bytes = None
        if image:
            image_bytes = await image.read()
            # Validate image type
            if not image.content_type or not image.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400,
                    detail="Uploaded file must be an image (JPEG, PNG, etc.)"
                )
        
        # Create content plan with optional image
        return await create_content_plan(brief, image_bytes=image_bytes)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON in brief: {str(e)}"
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate content plan: {str(e)}"
        )
