"""Service for rendering videos from content bank items.

This service orchestrates the full pipeline:
1. Load bank item
2. Ensure voiceover exists
3. Select/reuse visuals
4. Render via Creatomate
5. Update bank item with results
"""
import logging
from typing import Optional, List

from sqlalchemy.orm import Session

from app.services.bank_service import get_bank_item, update_bank_item, mark_item_used
from app.models.bank import BankItemUpdate
from app.services.voiceover_pipeline import ensure_voiceover_for_bank_item
from app.services.pexels_client import search_videos
from app.services.video_service import render_video
from app.models.video import VideoRenderRequest, AssetSelection

logger = logging.getLogger(__name__)


async def _select_visuals_for_bank_item(
    db: Session,
    item,
    max_clips: int = 2,
) -> List[str]:
    """Select visual assets (Pexels videos) for a bank item.

    If primary_asset_url already exists, reuse it. Otherwise, search Pexels
    based on content_pillar, topic_cluster, and hook keywords.

    Args:
        db: Database session
        item: BankItem with script, caption, pillar, etc.
        max_clips: Maximum number of clips to select (1-2)

    Returns:
        List of asset URLs (Pexels video URLs)
    """
    # If we already have assets, reuse them
    if item.primary_asset_url:
        urls = [item.primary_asset_url]
        if item.secondary_asset_url and max_clips > 1:
            urls.append(item.secondary_asset_url)
        logger.info(f"Reusing existing assets for bank item {item.id}")
        return urls[:max_clips]

    # Build search query from pillar + hook
    search_terms = []
    
    # Map pillar to search terms
    pillar_terms = {
        "education": ["wellness", "health", "lifestyle"],
        "routine": ["morning", "evening", "routine", "daily"],
        "story": ["transformation", "journey", "before after"],
        "product_integration": ["product", "supplement", "wellness"],
    }
    search_terms.extend(pillar_terms.get(item.content_pillar, ["wellness"]))

    # Add keywords from title/hook (first few words)
    if item.title:
        title_words = item.title.lower().split()[:3]
        search_terms.extend([w for w in title_words if len(w) > 3])

    # Add topic cluster if available
    if item.topic_cluster:
        cluster_words = item.topic_cluster.replace("_", " ").split()
        search_terms.extend(cluster_words)

    # Combine and search
    query = " ".join(search_terms[:5])  # Limit to 5 terms
    logger.info(f"Searching Pexels for bank item {item.id} with query: '{query}'")

    try:
        results = await search_videos(query, max_results=max_clips * 2)  # Get extra for filtering
        
        if not results:
            # Fallback to generic wellness search
            logger.warning(f"No Pexels results for '{query}', trying generic wellness search")
            results = await search_videos("wellness lifestyle", max_results=max_clips * 2)

        # Extract video URLs from AssetResult objects
        selected = [result.video_url for result in results[:max_clips]]

        if selected:
            logger.info(f"Selected {len(selected)} visuals for bank item {item.id}")
            return selected[:max_clips]
        else:
            logger.error(f"Could not find suitable Pexels videos for bank item {item.id}")
            return []

    except Exception as e:
        logger.error(f"Error selecting visuals for bank item {item.id}: {type(e).__name__}: {e}")
        return []


async def render_video_from_bank_item(
    db: Session,
    item_id: int,
    template_type: str = "video",
) -> Optional[str]:
    """Render a video from a content bank item.

    This function:
    1. Loads the bank item (must be approved)
    2. Ensures voiceover exists (generates if missing)
    3. Selects/reuses visuals
    4. Renders via Creatomate with voiceover
    5. Updates bank item with rendered_video_url and status
    6. Marks item as used

    Args:
        db: Database session
        item_id: Content bank item ID
        template_type: "image" or "video" (default: "video")

    Returns:
        Rendered video URL if successful, None otherwise
    """
    item = get_bank_item(db, item_id)
    if not item:
        logger.error(f"Bank item {item_id} not found")
        return None

    if item.status != "approved":
        logger.warning(
            f"Bank item {item_id} is not approved (status={item.status}), "
            f"cannot render"
        )
        return None

    try:
        # Step 1: Ensure voiceover exists
        logger.info(f"Ensuring voiceover for bank item {item_id}...")
        voiceover_url = await ensure_voiceover_for_bank_item(db, item_id)
        if not voiceover_url:
            logger.error(f"Failed to generate voiceover for bank item {item_id}")
            update_bank_item(
                db,
                item_id,
                BankItemUpdate(last_render_status="failed: voiceover_generation_failed"),
            )
            return None

        # Step 2: Select visuals
        logger.info(f"Selecting visuals for bank item {item_id}...")
        asset_urls = await _select_visuals_for_bank_item(db, item, max_clips=2 if template_type == "video" else 1)
        
        if not asset_urls:
            logger.error(f"Could not select visuals for bank item {item_id}")
            update_bank_item(
                db,
                item_id,
                BankItemUpdate(last_render_status="failed: no_visuals_found"),
            )
            return None

        # Save selected assets to bank item for future reuse
        update_data = BankItemUpdate(primary_asset_url=asset_urls[0])
        if len(asset_urls) > 1:
            update_data.secondary_asset_url = asset_urls[1]
        update_bank_item(db, item_id, update_data)

        # Step 3: Build render request
        render_request = VideoRenderRequest(
            assets=[
                AssetSelection(id=url, start_at=None, end_at=None) for url in asset_urls
            ],
            script=item.script,
            template_type=template_type,
            voiceover_url=voiceover_url,
            prioritize_voiceover=True,  # Voiceover is primary, music optional
        )

        # Step 4: Render
        logger.info(f"Rendering video for bank item {item_id}...")
        update_bank_item(db, item_id, BankItemUpdate(last_render_status="pending"))
        
        render_job = await render_video(render_request)
        
        if render_job.status == "succeeded" and render_job.video_url:
            # Step 5: Update bank item with success
            update_bank_item(
                db,
                item_id,
                BankItemUpdate(
                    rendered_video_url=render_job.video_url,
                    last_render_status="succeeded",
                ),
            )
            mark_item_used(db, item_id)
            
            logger.info(
                f"Successfully rendered video for bank item {item_id}: "
                f"{render_job.video_url[:80]}..."
            )
            return render_job.video_url
        else:
            # Render failed
            error_msg = render_job.error_message or "unknown_error"
            update_bank_item(
                db,
                item_id,
                BankItemUpdate(last_render_status=f"failed: {error_msg[:200]}"),
            )
            logger.error(f"Render failed for bank item {item_id}: {error_msg}")
            return None

    except Exception as e:
        logger.error(f"Error rendering video from bank item {item_id}: {type(e).__name__}: {e}")
        update_bank_item(
            db,
            item_id,
            BankItemUpdate(last_render_status=f"failed: {str(e)[:200]}"),
        )
        return None
