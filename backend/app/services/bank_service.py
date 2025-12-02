"""Service layer for content bank operations and simple batch jobs.

This keeps all DB access in one place so the API router stays thin.
"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database.models import ContentBankItem, BatchJob
from app.models.bank import (
    BankItem,
    BankItemCreate,
    BankItemUpdate,
    BankItemFilters,
    BatchJob as BatchJobModel,
)


def list_bank_items(db: Session, filters: BankItemFilters, prioritize_unused: bool = False) -> List[BankItem]:
    """List content bank items with optional filtering.

    Filters are intentionally simple: status, pillar, tone, length ranges, text search.
    
    Args:
        db: Database session
        filters: Filter criteria
        prioritize_unused: If True, prefer items not used recently and avoid same topic_cluster consecutively
    """
    query = db.query(ContentBankItem)

    if filters.status:
        query = query.filter(ContentBankItem.status == filters.status)

    if filters.content_pillar:
        query = query.filter(ContentBankItem.content_pillar == filters.content_pillar)

    if filters.tone:
        query = query.filter(ContentBankItem.tone == filters.tone)

    if filters.min_length_seconds is not None:
        query = query.filter(ContentBankItem.length_seconds >= filters.min_length_seconds)

    if filters.max_length_seconds is not None:
        query = query.filter(ContentBankItem.length_seconds <= filters.max_length_seconds)

    if filters.search:
        like = f"%{filters.search}%"
        query = query.filter(
            or_(
                ContentBankItem.title.ilike(like),
                ContentBankItem.script.ilike(like),
                ContentBankItem.caption.ilike(like),
            )
        )

    # For dad's UX: prioritize unused items and variety
    if prioritize_unused:
        # Order by: never used first, then least recently used, then newest
        # This encourages variety and prevents overusing the same scripts
        query = query.order_by(
            ContentBankItem.times_used.asc(),  # Never used = 0, prefer those
            ContentBankItem.last_used_at.asc().nullsfirst(),  # Never used = NULL, prefer those
            ContentBankItem.created_at.desc(),  # Then newest
        )
    else:
        # Default: newest approved content first
        query = query.order_by(ContentBankItem.status.desc(), ContentBankItem.created_at.desc())

    items = query.limit(filters.limit).all()
    return [BankItem.from_orm(item) for item in items]


def get_bank_item(db: Session, item_id: int) -> Optional[BankItem]:
    item = db.query(ContentBankItem).filter(ContentBankItem.id == item_id).first()
    return BankItem.from_orm(item) if item else None


def create_bank_item(db: Session, data: BankItemCreate) -> BankItem:
    item = ContentBankItem(
        title=data.title,
        script=data.script,
        caption=data.caption,
        content_pillar=data.content_pillar,
        tone=data.tone,
        length_seconds=data.length_seconds,
        status=data.status,
        created_from=data.created_from,
        times_used=data.times_used,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return BankItem.from_orm(item)


def update_bank_item(db: Session, item_id: int, data: BankItemUpdate) -> Optional[BankItem]:
    item = db.query(ContentBankItem).filter(ContentBankItem.id == item_id).first()
    if not item:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    item.updated_at = datetime.utcnow()
    db.add(item)
    db.commit()
    db.refresh(item)
    return BankItem.from_orm(item)


def delete_bank_item(db: Session, item_id: int) -> bool:
    """Soft-delete by setting status=archived.

    We avoid hard deletes so history is preserved.
    """
    item = db.query(ContentBankItem).filter(ContentBankItem.id == item_id).first()
    if not item:
        return False

    item.status = "archived"
    item.updated_at = datetime.utcnow()
    db.add(item)
    db.commit()
    return True


def mark_item_used(db: Session, item_id: int) -> None:
    """Increment times_used and update last_used_at when a render is created from this bank item."""
    item = db.query(ContentBankItem).filter(ContentBankItem.id == item_id).first()
    if not item:
        return

    item.times_used = (item.times_used or 0) + 1
    item.last_used_at = datetime.utcnow()
    item.updated_at = datetime.utcnow()
    db.add(item)
    db.commit()


def create_batch_job(db: Session, job: BatchJobModel) -> BatchJobModel:
    db_job = BatchJob(
        type=job.type,
        payload_json=job.payload_json,
        status=job.status,
        progress=job.progress,
        error=job.error,
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return BatchJobModel.from_orm(db_job)


def get_batch_job(db: Session, job_id: int) -> Optional[BatchJobModel]:
    job = db.query(BatchJob).filter(BatchJob.id == job_id).first()
    return BatchJobModel.from_orm(job) if job else None


def update_batch_job_status(
    db: Session,
    job_id: int,
    *,
    status: Optional[str] = None,
    progress: Optional[int] = None,
    error: Optional[str] = None,
) -> Optional[BatchJobModel]:
    job = db.query(BatchJob).filter(BatchJob.id == job_id).first()
    if not job:
        return None

    if status is not None:
        job.status = status
    if progress is not None:
        job.progress = progress
    if error is not None:
        job.error = error
    if status in {"succeeded", "failed"}:
        job.completed_at = datetime.utcnow()

    db.add(job)
    db.commit()
    db.refresh(job)
    return BatchJobModel.from_orm(job)
