"""Batch content generation service for populating the content bank.

This service generates multiple scripts in one batch, with diversity checks
to avoid near-duplicate content and series-aware prompts for variety.
"""
import logging
from typing import List, Optional
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.database.models import ContentBankItem
from app.models.bank import BankItemCreate
from app.models.content import ContentBrief, GeneratedPlan
from app.services.content_service import create_content_plan
from app.services.bank_service import create_bank_item, list_bank_items
from app.models.bank import BankItemFilters

logger = logging.getLogger(__name__)


def _calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculate simple similarity score between two texts using word overlap.

    Returns a score between 0.0 (completely different) and 1.0 (identical).
    This is a simple heuristic; for production you might use embeddings.
    """
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1 & words2
    union = words1 | words2
    
    return len(intersection) / len(union) if union else 0.0


def _is_near_duplicate(
    db: Session,
    new_title: str,
    new_script: str,
    content_pillar: str,
    topic_cluster: Optional[str] = None,
    similarity_threshold: float = 0.4,
    lookback_days: int = 30,
) -> bool:
    """Check if a new script is too similar to existing bank items.

    Args:
        db: Database session
        new_title: Title/hook of the new script
        new_script: Full script text
        content_pillar: Content pillar to filter by
        topic_cluster: Optional topic cluster to filter by
        similarity_threshold: Threshold above which we consider it a duplicate (0.0-1.0)
        lookback_days: How many days back to check for duplicates

    Returns:
        True if this looks like a near-duplicate, False otherwise
    """
    cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)
    
    # Query recent items in the same pillar (and optionally same cluster)
    query = db.query(ContentBankItem).filter(
        ContentBankItem.content_pillar == content_pillar,
        ContentBankItem.created_at >= cutoff_date,
    )
    
    if topic_cluster:
        query = query.filter(ContentBankItem.topic_cluster == topic_cluster)
    
    recent_items = query.all()
    
    for item in recent_items:
        # Check title similarity
        title_sim = _calculate_text_similarity(new_title, item.title)
        if title_sim > similarity_threshold:
            logger.info(
                f"Near-duplicate detected: title similarity {title_sim:.2f} with item {item.id} "
                f"('{item.title[:50]}...')"
            )
            return True
        
        # Check script similarity (first 200 chars for speed)
        script_sim = _calculate_text_similarity(
            new_script[:200],
            item.script[:200] if item.script else "",
        )
        if script_sim > similarity_threshold:
            logger.info(
                f"Near-duplicate detected: script similarity {script_sim:.2f} with item {item.id}"
            )
            return True
    
    return False


import random

# Diverse angles/frameworks to ensure variety in batch generation
CONTENT_FRAMEWORKS = [
    {
        "name": "The 'Did You Know' Hook",
        "instruction": "Start with a surprising fact ('Did you know...?') related to the topic, then explain why it matters."
    },
    {
        "name": "The 'Before vs After'",
        "instruction": "Structure the script as a transformation story: describe a common struggle (Before) and then the improved state (After) using this topic."
    },
    {
        "name": "The '3 Quick Tips' Listicle",
        "instruction": "Create a punchy listicle content style: 'Here are 3 quick ways to [achieve benefit]...'."
    },
    {
        "name": "The 'Unpopular Opinion'",
        "instruction": "Frame the script as a contrarian or unique take: 'Most people think X, but actually Y...' to stop the scroll."
    },
    {
        "name": "The 'Personal Story' Bridge",
        "instruction": "Start with a relatable 'I used to struggle with...' micro-story that bridges into the educational point."
    },
    {
        "name": "The 'Common Myth' buster",
        "instruction": "Identify a common misconception about this topic and debunk it immediately."
    },
    {
        "name": "The 'How-To' Walkthrough",
        "instruction": "A direct, step-by-step instructional style: 'Step 1, Step 2, Step 3'."
    },
    {
        "name": "The 'Direct Question' Opener",
        "instruction": "Start with a qualifying question like 'Do you ever feel like...?' that targets the audience directly."
    }
]

async def generate_batch_content(
    db: Session,
    *,
    topic_theme: str,
    content_pillars: List[str],
    tone: str = "friendly",
    count: int = 10,
    min_length_seconds: int = 15,
    max_length_seconds: int = 45,
    topic_cluster: Optional[str] = None,
    series_name: Optional[str] = None,
    similarity_threshold: float = 0.4,
) -> List[int]:
    """Generate a batch of content bank items using Gemini.

    This function:
    1. Calls Gemini multiple times with series-aware prompts
    2. Checks each result for near-duplicates before inserting
    3. Inserts new rows in 'draft' status
    4. Returns list of created bank item IDs

    Args:
        db: Database session
        topic_theme: High-level theme (e.g., "afternoon energy", "evening routines")
        content_pillars: List of pillars to generate (e.g., ["education", "routine"])
        tone: Tone for all generated content
        count: Number of items to generate
        min_length_seconds: Target minimum video length
        max_length_seconds: Target maximum video length
        topic_cluster: Optional cluster name for grouping (e.g., "afternoon_energy")
        series_name: Optional series name (e.g., "Energy Tip Tuesday")
        similarity_threshold: Threshold for duplicate detection (0.0-1.0)

    Returns:
        List of created bank item IDs
    """
    created_ids = []
    failed_count = 0
    duplicate_count = 0
    
    # Get existing items in this cluster/pillar for context
    existing_context = []
    if topic_cluster:
        filters = BankItemFilters(
            content_pillar=content_pillars[0] if content_pillars else None,
            limit=20,
        )
        existing = list_bank_items(db, filters)
        existing_context = [
            {
                "title": item.title,
                "hook": item.script.split("\n")[0] if item.script else "",
            }
            for item in existing
            if item.topic_cluster == topic_cluster
        ][:5]  # Last 5 for context
    
    logger.info(
        f"Starting batch generation: theme='{topic_theme}', pillars={content_pillars}, "
        f"count={count}, cluster='{topic_cluster}'"
    )
    
    # Shuffle frameworks to ensure random selection without immediate repeats if possible
    available_frameworks = list(CONTENT_FRAMEWORKS)
    random.shuffle(available_frameworks)
    
    for i in range(count):
        # Rotate through pillars if multiple provided
        pillar = content_pillars[i % len(content_pillars)] if content_pillars else "education"
        
        # Pick a framework (cycling through if we run out)
        framework = available_frameworks[i % len(available_frameworks)]
        
        try:
            # Build a brief that encourages variety using the framework
            user_topic_with_framework = (
                f"{topic_theme} - {pillar} perspective.\n"
                f"STRICTLY FOLLOW THIS CONTENT ANGLE: {framework['instruction']}"
            )

            if series_name:
                user_topic_with_framework += f"\nPart of series: '{series_name}'"

            brief = ContentBrief(
                mode="manual",
                user_topic=user_topic_with_framework,
                platforms=["TikTok", "Instagram"],
                tone=tone,
                length_seconds=(min_length_seconds + max_length_seconds) // 2,
                template_type="video",  # Default to video, can be overridden
            )
            
            # Generate content plan
            plan: GeneratedPlan = await create_content_plan(brief)
            
            # Extract hook from script (first line or first sentence)
            hook = plan.script.split("\n")[0].strip()
            if len(hook) > 100:
                hook = hook[:97] + "..."
            
            # Check for duplicates
            if _is_near_duplicate(
                db,
                hook,
                plan.script,
                pillar,
                topic_cluster=topic_cluster,
                similarity_threshold=similarity_threshold,
            ):
                duplicate_count += 1
                logger.info(f"Skipping duplicate item {i+1}/{count}")
                continue
            
            # Create bank item
            bank_item = BankItemCreate(
                title=hook,
                script=plan.script,
                caption=plan.caption,
                content_pillar=pillar,
                tone=tone,
                length_seconds=len(plan.script.split()) * 0.5,  # Rough estimate
                status="draft",
                created_from="ai_batch",
                topic_cluster=topic_cluster,
                series_name=series_name,
                target_problem=topic_theme,  # Use theme as problem description
            )
            
            created = create_bank_item(db, bank_item)
            created_ids.append(created.id)
            
            logger.info(
                f"Generated bank item {i+1}/{count}: id={created.id}, "
                f"framework='{framework['name']}', title='{created.title[:50]}...'"
            )
            
        except Exception as e:
            failed_count += 1
            logger.error(f"Failed to generate item {i+1}/{count}: {type(e).__name__}: {e}")
            # Continue to next item rather than failing entire batch
    
    logger.info(
        f"Batch generation complete: {len(created_ids)} created, "
        f"{duplicate_count} duplicates skipped, {failed_count} failed"
    )
    
    return created_ids
