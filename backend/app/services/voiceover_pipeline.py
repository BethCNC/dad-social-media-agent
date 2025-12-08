"""Voiceover generation pipeline for content bank items.

This service ensures approved bank items have voiceover URLs generated
and stored, with error handling and status tracking.
"""
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.database.models import ContentBankItem
from app.services.voiceover_service import generate_voiceover_url
from app.services.bank_service import update_bank_item
from app.models.bank import BankItemUpdate

logger = logging.getLogger(__name__)


async def ensure_voiceover_for_bank_item(db: Session, item_id: int) -> Optional[str]:
    """Ensure a bank item has a voiceover URL, generating it if missing.

    This function:
    1. Loads the bank item
    2. If voiceover_url is empty and status is 'approved', generates VO
    3. Updates the bank item with the voiceover_url
    4. Returns the URL or None if generation failed

    Args:
        db: Database session
        item_id: Content bank item ID

    Returns:
        Voiceover URL if successful, None otherwise
    """
    from app.services.bank_service import get_bank_item

    item = get_bank_item(db, item_id)
    if not item:
        logger.error(f"Bank item {item_id} not found")
        return None

    # If already has voiceover, return it
    if item.voiceover_url:
        logger.info(f"Bank item {item_id} already has voiceover_url: {item.voiceover_url[:80]}...")
        return item.voiceover_url

    # Check if external TTS is configured
    from app.core.config import get_settings
    settings = get_settings()
    if not getattr(settings, "TTS_API_URL", None):
        logger.info(f"External TTS not configured, skipping voiceover generation for bank item {item_id}")
        return None

    # Only generate for approved items (safety check)
    if item.status != "approved":
        logger.warning(
            f"Bank item {item_id} is not approved (status={item.status}), "
            f"skipping voiceover generation"
        )
        return None

    # Generate voiceover
    try:
        logger.info(f"Generating voiceover for bank item {item_id}...")
        voiceover_url = await generate_voiceover_url(item.script)

        # Update bank item with voiceover URL
        update_data = BankItemUpdate(voiceover_url=voiceover_url)
        update_bank_item(db, item_id, update_data)

        logger.info(f"Successfully generated voiceover for bank item {item_id}: {voiceover_url[:80]}...")
        return voiceover_url

    except Exception as e:
        logger.error(f"Failed to generate voiceover for bank item {item_id}: {type(e).__name__}: {e}")
        # Store error in last_render_status for admin visibility
        update_data = BankItemUpdate(last_render_status=f"voiceover_error: {str(e)[:200]}")
        update_bank_item(db, item_id, update_data)
        return None
