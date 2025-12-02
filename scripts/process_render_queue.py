#!/usr/bin/env python3
"""Background worker script to process batch video rendering jobs.

This script:
1. Polls the batch_jobs table for pending video_render jobs
2. Processes each job by rendering videos from content bank items
3. Updates job progress and status
4. Can be run as a cron job or long-running process

Usage:
    python scripts/process_render_queue.py [--once] [--job-id JOB_ID]

Options:
    --once: Process one job and exit (for cron)
    --job-id: Process a specific job ID
"""
import asyncio
import argparse
import logging
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy.orm import Session

from app.database.database import get_db, engine
from app.services.bank_service import (
    get_batch_job,
    update_batch_job_status,
    get_bank_item,
)
from app.services.render_from_bank_service import render_video_from_bank_item

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def process_batch_render_job(db: Session, job_id: int) -> bool:
    """Process a single batch render job.

    Args:
        db: Database session
        job_id: Batch job ID

    Returns:
        True if job completed successfully, False otherwise
    """
    job = get_batch_job(db, job_id)
    if not job:
        logger.error(f"Batch job {job_id} not found")
        return False

    if job.type != "video_render":
        logger.warning(f"Job {job_id} is not a video_render job (type={job.type})")
        return False

    if job.status not in ["pending", "running"]:
        logger.info(f"Job {job_id} is already {job.status}, skipping")
        return False

    # Mark as running
    update_batch_job_status(db, job_id, status="running", progress=0)

    try:
        content_ids = job.payload_json.get("resolved_content_ids", [])
        template_type = job.payload_json.get("template_type", "video")
        total = len(content_ids)

        if not content_ids:
            logger.warning(f"Job {job_id} has no content_ids to render")
            update_batch_job_status(db, job_id, status="succeeded", progress=100)
            return True

        logger.info(f"Processing batch render job {job_id}: {total} items to render")

        succeeded = 0
        failed = 0

        for idx, item_id in enumerate(content_ids):
            try:
                # Check if item exists and is approved
                item = get_bank_item(db, item_id)
                if not item:
                    logger.warning(f"Bank item {item_id} not found, skipping")
                    failed += 1
                    continue

                if item.status != "approved":
                    logger.warning(
                        f"Bank item {item_id} is not approved (status={item.status}), skipping"
                    )
                    failed += 1
                    continue

                # Render video
                logger.info(f"Rendering video for bank item {item_id} ({idx+1}/{total})...")
                video_url = await render_video_from_bank_item(db, item_id, template_type=template_type)

                if video_url:
                    succeeded += 1
                    logger.info(f"✓ Successfully rendered item {item_id}")
                else:
                    failed += 1
                    logger.error(f"✗ Failed to render item {item_id}")

            except Exception as e:
                failed += 1
                logger.error(f"Error rendering item {item_id}: {type(e).__name__}: {e}")

            # Update progress
            progress = int(((idx + 1) / total) * 100)
            update_batch_job_status(db, job_id, progress=progress)

        # Mark job as complete
        if failed == 0:
            status = "succeeded"
            error = None
        elif succeeded == 0:
            status = "failed"
            error = f"All {total} renders failed"
        else:
            status = "succeeded"  # Partial success is still success
            error = f"{failed} of {total} renders failed"

        update_batch_job_status(
            db,
            job_id,
            status=status,
            progress=100,
            error=error,
        )

        logger.info(
            f"Batch render job {job_id} complete: {succeeded} succeeded, {failed} failed"
        )
        return True

    except Exception as e:
        logger.error(f"Error processing batch render job {job_id}: {type(e).__name__}: {e}")
        update_batch_job_status(
            db,
            job_id,
            status="failed",
            error=str(e)[:500],
        )
        return False


async def main():
    """Main worker loop."""
    parser = argparse.ArgumentParser(description="Process batch video rendering jobs")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Process one job and exit (for cron)",
    )
    parser.add_argument(
        "--job-id",
        type=int,
        help="Process a specific job ID",
    )
    args = parser.parse_args()

    db = next(get_db())

    try:
        if args.job_id:
            # Process specific job
            await process_batch_render_job(db, args.job_id)
        elif args.once:
            # Find and process one pending job
            from app.database.models import BatchJob
            from sqlalchemy import and_

            job = (
                db.query(BatchJob)
                .filter(
                    and_(
                        BatchJob.type == "video_render",
                        BatchJob.status == "pending",
                    )
                )
                .order_by(BatchJob.created_at.asc())
                .first()
            )

            if job:
                await process_batch_render_job(db, job.id)
            else:
                logger.info("No pending video_render jobs found")
        else:
            # Continuous loop (for long-running worker)
            logger.info("Starting batch render worker (continuous mode)...")
            while True:
                from app.database.models import BatchJob
                from sqlalchemy import and_

                job = (
                    db.query(BatchJob)
                    .filter(
                        and_(
                            BatchJob.type == "video_render",
                            BatchJob.status == "pending",
                        )
                    )
                    .order_by(BatchJob.created_at.asc())
                    .first()
                )

                if job:
                    await process_batch_render_job(db, job.id)
                else:
                    logger.info("No pending jobs, sleeping 30 seconds...")
                    await asyncio.sleep(30)

    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
