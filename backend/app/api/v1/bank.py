"""Content bank API routes.

These routes expose a simple CRUD API for pre-generated scripts + captions
that live in the content bank, plus basic batch job inspection.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.bank import (
    BankItem,
    BankItemCreate,
    BankItemUpdate,
    BankItemFilters,
    BatchJob,
    BatchJobBase,
    BatchGenerateRequest,
)
from app.services.bank_service import (
    list_bank_items,
    get_bank_item,
    create_bank_item,
    update_bank_item,
    delete_bank_item,
    get_batch_job,
    create_batch_job,
    update_batch_job_status,
)
from app.services.batch_generation_service import generate_batch_content
from app.services.voiceover_pipeline import ensure_voiceover_for_bank_item

router = APIRouter()


@router.get("/bank", response_model=List[BankItem])
def list_bank(
    search: Optional[str] = Query(None, description="Free text search across title, script, caption"),
    status: Optional[str] = Query(None, description="draft | approved | archived"),
    content_pillar: Optional[str] = Query(None, description="education | routine | story | product_integration"),
    tone: Optional[str] = Query(None, description="friendly | educational | etc."),
    min_length_seconds: Optional[int] = Query(None),
    max_length_seconds: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    prioritize_unused: bool = Query(False, description="Prioritize items not used recently for variety"),
    db: Session = Depends(get_db),
) -> List[BankItem]:
    """List content bank items for selection in the UI.

    For your dad's primary flow, the frontend will typically call this with
    `status=approved` and a small `limit`, then present a very simple card list.
    
    Set `prioritize_unused=True` to get fresh, varied content that hasn't been
    overused, avoiding repetition.
    """
    filters = BankItemFilters(
        search=search,
        status=status,  # type: ignore[arg-type]
        content_pillar=content_pillar,
        tone=tone,
        min_length_seconds=min_length_seconds,
        max_length_seconds=max_length_seconds,
        limit=limit,
    )
    return list_bank_items(db, filters, prioritize_unused=prioritize_unused)


@router.get("/bank/{item_id}", response_model=BankItem)
def get_bank_item_detail(item_id: int, db: Session = Depends(get_db)) -> BankItem:
    item = get_bank_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content bank item not found")
    return item


@router.post("/bank", response_model=BankItem, status_code=201)
def create_bank_entry(payload: BankItemCreate, db: Session = Depends(get_db)) -> BankItem:
    """Create a new content bank item.

    This is primarily for manual/admin use or future batch generators.
    """
    return create_bank_item(db, payload)


@router.patch("/bank/{item_id}", response_model=BankItem)
def update_bank_entry(item_id: int, payload: BankItemUpdate, db: Session = Depends(get_db)) -> BankItem:
    item = update_bank_item(db, item_id, payload)
    if not item:
        raise HTTPException(status_code=404, detail="Content bank item not found")
    return item


@router.delete("/bank/{item_id}", status_code=204)
def archive_bank_entry(item_id: int, db: Session = Depends(get_db)) -> None:
    """Soft-delete a bank item by marking it archived.

    Actual row is kept so history and batch logs remain intact.
    """
    ok = delete_bank_item(db, item_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Content bank item not found")


@router.get("/batch-jobs/{job_id}", response_model=BatchJob)
def get_batch_job_detail(job_id: int, db: Session = Depends(get_db)) -> BatchJob:
    job = get_batch_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Batch job not found")
    return job


@router.post("/bank/batch-generate", response_model=BatchJob, status_code=202)
async def batch_generate_content(
    request: BatchGenerateRequest,
    db: Session = Depends(get_db),
) -> BatchJob:
    """Queue a batch content generation job.

    This endpoint immediately returns a batch job ID. The actual generation
    happens asynchronously (you can poll /batch-jobs/{id} for status).

    For now, we run it synchronously but return a job record for future
    async worker integration.
    """
    payload = request.model_dump()
    
    # Create batch job record
    job_model = BatchJobBase(
        type="content_generation",
        payload_json=payload,
        status="running",
        progress=0,
    )
    job = create_batch_job(db, job_model)
    
    # Run generation (for now, synchronously; later this would be a background task)
    try:
        created_ids = await generate_batch_content(
            db,
            topic_theme=request.topic_theme,
            content_pillars=request.content_pillars,
            tone=request.tone,
            count=request.count,
            min_length_seconds=request.min_length_seconds,
            max_length_seconds=request.max_length_seconds,
            topic_cluster=request.topic_cluster,
            series_name=request.series_name,
            similarity_threshold=request.similarity_threshold,
        )
        
        # Update job as succeeded
        update_batch_job_status(
            db,
            job.id,
            status="succeeded",
            progress=100,
        )
        
        # Refresh and return
        job = get_batch_job(db, job.id)
        if job:
            # Add created_ids to payload for reference
            job.payload_json["created_item_ids"] = created_ids
        
        return job
    except Exception as e:
        # Mark job as failed
        update_batch_job_status(
            db,
            job.id,
            status="failed",
            error=str(e),
        )
        raise HTTPException(
            status_code=500,
            detail=f"Batch generation failed: {str(e)}"
        )


@router.post("/bank/{item_id}/voiceover", response_model=BankItem)
async def generate_voiceover_for_item(
    item_id: int,
    db: Session = Depends(get_db),
) -> BankItem:
    """Generate voiceover for a bank item.

    This endpoint:
    1. Checks if the item is approved (required for VO generation)
    2. Generates voiceover if missing
    3. Updates the bank item with voiceover_url
    4. Returns the updated item
    """
    item = get_bank_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content bank item not found")
    
    if item.status != "approved":
        raise HTTPException(
            status_code=400,
            detail=f"Item must be approved before generating voiceover. Current status: {item.status}"
        )
    
    voiceover_url = await ensure_voiceover_for_bank_item(db, item_id)
    if not voiceover_url:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate voiceover. Check TTS configuration and try again."
        )
    
    # Return updated item
    updated = get_bank_item(db, item_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Content bank item not found after update")
    
    return updated
