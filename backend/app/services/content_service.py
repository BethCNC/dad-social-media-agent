"""Content generation service."""
import csv
import logging
import random
from datetime import date
from functools import lru_cache
from pathlib import Path
from typing import Optional

from fastapi import HTTPException

from app.models.content import ContentBrief, GeneratedPlan
from app.services.gemini_client import generate_content_plan_gemini
from app.services.holiday_service import (
    get_holiday_context_for_date,
    get_upcoming_holidays,
)

logger = logging.getLogger(__name__)

# Path to curated Unicity script ideas used when suggesting topics automatically.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
SCRIPTS_CSV_PATH = PROJECT_ROOT / "unicity-scripts.csv"


@lru_cache(maxsize=1)
def _load_unicity_scripts() -> list[dict]:
    """
    Load curated Unicity script ideas from CSV.

    Returns an empty list if the file is missing so that the system
    gracefully falls back to pure AI generation.
    """
    if not SCRIPTS_CSV_PATH.exists():
        logger.warning(
            "unicity-scripts.csv not found at %s; auto topic suggestions will "
            "use AI-only generation.",
            SCRIPTS_CSV_PATH,
        )
        return []

    try:
        with SCRIPTS_CSV_PATH.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = [row for row in reader if row.get("Script/Quote")]
            logger.info("Loaded %d curated Unicity scripts from CSV", len(rows))
            return rows
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Failed to load unicity-scripts.csv: %s", exc)
        return []


def _pick_random_script_row() -> Optional[dict]:
    """Pick a random curated script row, or None if none are available."""
    rows = _load_unicity_scripts()
    if not rows:
        return None
    return random.choice(rows)


async def create_content_plan(brief: ContentBrief, image_bytes: Optional[bytes] = None) -> GeneratedPlan:
    """
    Create content plan from brief.

    Args:
        brief: Content brief (supports manual/auto mode with holiday integration)
        image_bytes: Optional image bytes for multimodal content generation

    Returns:
        GeneratedPlan with script, caption, and shot plan

    Raises:
        HTTPException: If content generation fails
    """
    try:
        # Handle backward compatibility: if idea is provided but user_topic is not, use idea
        if not brief.user_topic and brief.idea:
            brief.user_topic = brief.idea

        # If the user chose "Suggest a topic", seed the brief with a random
        # curated Unicity script so suggestions don't repeat every time.
        if brief.mode == "auto" and not brief.user_topic:
            row = _pick_random_script_row()
            if row:
                # Use the curated script/quote as the high-level idea.
                brief.user_topic = row.get("Script/Quote") or None

                # If tone wasn't explicitly set to something other than the
                # default, let the curated tone steer the generation.
                csv_tone = (row.get("Tone") or "").strip()
                if csv_tone and brief.tone == "friendly":
                    brief.tone = csv_tone

                # Map suggested visual to template type when possible.
                suggested_visual = (row.get("Suggested Visual") or "").lower()
                if suggested_visual.startswith("video"):
                    brief.template_type = "video"
                elif suggested_visual.startswith("graphic") or suggested_visual.startswith("photo"):
                    brief.template_type = "image"

        # Determine target date for holiday context
        target_date = date.today()
        if brief.target_date:
            try:
                target_date = date.fromisoformat(brief.target_date)
            except ValueError:
                logger.warning(f"Invalid target_date format: {brief.target_date}, using today")
                target_date = date.today()
        
        # Fetch holiday context if needed
        holiday_context = None
        if brief.mode == "auto" and brief.use_holidays:
            # For auto mode with holidays, get upcoming marketing-relevant holidays
            try:
                upcoming = get_upcoming_holidays(days=14)
                marketing_relevant = [h for h in upcoming if h.is_marketing_relevant]
                
                # If a specific holiday is selected, prioritize it
                if brief.selected_holiday_id:
                    selected = [h for h in marketing_relevant if h.id == brief.selected_holiday_id]
                    if selected:
                        marketing_relevant = selected + [h for h in marketing_relevant if h.id != brief.selected_holiday_id]
                
                holiday_context = {
                    "holidays_on_date": [],
                    "upcoming_holidays": [{"name": h.name, "date": str(h.date)} for h in marketing_relevant[:3]],
                    "marketing_relevant_holidays": [{"name": h.name, "date": str(h.date)} for h in marketing_relevant[:3]],
                }
            except Exception as e:
                logger.warning(f"Failed to fetch holiday context: {e}, continuing without holidays")
        elif brief.mode == "manual" and brief.target_date:
            # For manual mode, still include holiday context if target date is specified
            try:
                context = get_holiday_context_for_date(target_date, window_days=7)
                holiday_context = {
                    "holidays_on_date": [{"name": h.name, "date": str(h.date)} for h in context.holidays_on_date],
                    "upcoming_holidays": [{"name": h.name, "date": str(h.date)} for h in context.upcoming_holidays],
                    "marketing_relevant_holidays": [{"name": h.name, "date": str(h.date)} for h in context.marketing_relevant_holidays],
                }
            except Exception as e:
                logger.warning(f"Failed to fetch holiday context for date: {e}, continuing without holidays")
        
        return await generate_content_plan_gemini(brief, holiday_context=holiday_context, image_bytes=image_bytes)
    except ValueError as e:
        logger.error(f"Content generation validation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your content plan. Please try again with a different idea."
        ) from e
    except FileNotFoundError as e:
        logger.error(f"Client profile not found: {e}")
        raise HTTPException(
            status_code=500,
            detail="Configuration error. Please contact support."
        ) from e
    except Exception as e:
        logger.error(f"Content generation error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your content plan right now. Please try again in a few minutes."
        ) from e

