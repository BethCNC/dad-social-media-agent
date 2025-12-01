"""Holiday service for fetching and managing US holidays."""
import logging
import uuid
from datetime import date, timedelta, datetime
from typing import List, Optional
import httpx
from icalendar import Calendar
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.database.models import Holiday as HolidayModel
from app.models.holiday import Holiday, HolidayContext

logger = logging.getLogger(__name__)

# Google US Holidays ICS URL
GOOGLE_US_HOLIDAYS_URL = "https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics"

# Marketing-relevant holiday keywords (holidays that make sense to mention in wellness content)
MARKETING_RELEVANT_KEYWORDS = [
    "new year", "valentine", "easter", "mother", "father", "independence",
    "thanksgiving", "christmas", "memorial", "labor", "veterans", "martin luther",
    "presidents", "columbus", "juneteenth", "halloween", "st. patrick"
]


def is_marketing_relevant(holiday_name: str) -> bool:
    """
    Determine if a holiday is marketing-relevant for wellness content.
    
    Args:
        holiday_name: Name of the holiday
        
    Returns:
        True if the holiday is marketing-relevant
    """
    name_lower = holiday_name.lower()
    return any(keyword in name_lower for keyword in MARKETING_RELEVANT_KEYWORDS)


def parse_ics_holidays(ics_content: str) -> List[dict]:
    """
    Parse ICS calendar content and extract holidays.
    
    Args:
        ics_content: ICS calendar content as string
        
    Returns:
        List of holiday dictionaries with date, name, and category
    """
    holidays = []
    try:
        calendar = Calendar.from_ical(ics_content)
        
        for component in calendar.walk():
            if component.name == "VEVENT":
                summary = str(component.get("summary", ""))
                dtstart = component.get("dtstart")
                
                if dtstart:
                    event_date = dtstart.dt
                    if isinstance(event_date, date):
                        holidays.append({
                            "date": event_date,
                            "name": summary,
                            "category": "public_holiday",  # Default category
                        })
    except Exception as e:
        logger.error(f"Error parsing ICS content: {e}")
        raise ValueError(f"Failed to parse ICS calendar: {e}")
    
    return holidays


async def fetch_us_holidays() -> List[dict]:
    """
    Fetch US holidays from Google Calendar ICS feed.
    
    Returns:
        List of holiday dictionaries
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(GOOGLE_US_HOLIDAYS_URL)
            response.raise_for_status()
            return parse_ics_holidays(response.text)
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching holidays: {e}")
        raise ValueError(f"Failed to fetch holidays: {e}")
    except Exception as e:
        logger.error(f"Error fetching holidays: {e}")
        raise ValueError(f"Failed to fetch holidays: {e}")


async def sync_us_holidays(db: Optional[Session] = None) -> int:
    """
    Sync US holidays from Google Calendar into the database.
    
    This function fetches holidays from the ICS feed and upserts them into the database.
    It should be called periodically (e.g., monthly) to keep holidays up to date.
    
    Args:
        db: Optional database session. If None, creates a new session.
        
    Returns:
        Number of holidays synced
    """
    
    # Fetch holidays (async)
    try:
        holidays_data = await fetch_us_holidays()
    except Exception as e:
        logger.error(f"Failed to fetch holidays: {e}")
        return 0
    
    # Use provided session or create new one
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
    try:
        synced_count = 0
        
        for holiday_data in holidays_data:
            holiday_date = holiday_data["date"]
            holiday_name = holiday_data["name"]
            holiday_category = holiday_data.get("category", "public_holiday")
            
            # Generate a stable ID based on date and name
            holiday_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{holiday_date}_{holiday_name}"))
            
            # Check if holiday already exists
            existing = db.query(HolidayModel).filter(
                HolidayModel.id == holiday_id
            ).first()
            
            if existing:
                # Update existing holiday
                existing.date = holiday_date
                existing.name = holiday_name
                existing.category = holiday_category
                existing.is_marketing_relevant = is_marketing_relevant(holiday_name)
                existing.updated_at = datetime.utcnow()
            else:
                # Create new holiday
                new_holiday = HolidayModel(
                    id=holiday_id,
                    date=holiday_date,
                    name=holiday_name,
                    source="google_us_holidays",
                    category=holiday_category,
                    is_marketing_relevant=is_marketing_relevant(holiday_name),
                )
                db.add(new_holiday)
                synced_count += 1
        
        db.commit()
        logger.info(f"Synced {synced_count} new holidays, updated {len(holidays_data) - synced_count} existing")
        return synced_count
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing holidays: {e}")
        raise
    finally:
        if should_close:
            db.close()


def get_upcoming_holidays(days: int = 30, db: Optional[Session] = None) -> List[Holiday]:
    """
    Get upcoming holidays within the specified number of days.
    
    Args:
        days: Number of days to look ahead (default: 30)
        db: Optional database session
        
    Returns:
        List of Holiday models
    """
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
    try:
        today = date.today()
        end_date = today + timedelta(days=days)
        
        holidays = db.query(HolidayModel).filter(
            HolidayModel.date >= today,
            HolidayModel.date <= end_date
        ).order_by(HolidayModel.date).all()
        
        return [
            Holiday(
                id=h.id,
                date=h.date,
                name=h.name,
                source=h.source,
                category=h.category,
                is_marketing_relevant=h.is_marketing_relevant,
            )
            for h in holidays
        ]
    finally:
        if should_close:
            db.close()


def get_holidays_on_date(target_date: date, db: Optional[Session] = None) -> List[Holiday]:
    """
    Get all holidays on a specific date.
    
    Args:
        target_date: Date to check for holidays
        db: Optional database session
        
    Returns:
        List of Holiday models
    """
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
    try:
        holidays = db.query(HolidayModel).filter(
            HolidayModel.date == target_date
        ).all()
        
        return [
            Holiday(
                id=h.id,
                date=h.date,
                name=h.name,
                source=h.source,
                category=h.category,
                is_marketing_relevant=h.is_marketing_relevant,
            )
            for h in holidays
        ]
    finally:
        if should_close:
            db.close()


def get_holiday_context_for_date(
    target_date: date,
    window_days: int = 7,
    db: Optional[Session] = None
) -> HolidayContext:
    """
    Get holiday context for a specific date, including holidays on that date
    and upcoming holidays within the window.
    
    Args:
        target_date: Date to get context for
        window_days: Number of days to look ahead for upcoming holidays (default: 7)
        db: Optional database session
        
    Returns:
        HolidayContext with holidays on date and upcoming holidays
    """
    holidays_on_date = get_holidays_on_date(target_date, db)
    upcoming_holidays = get_upcoming_holidays(window_days, db)
    
    # Filter upcoming holidays to only those after target_date
    upcoming_after_date = [
        h for h in upcoming_holidays
        if h.date > target_date
    ]
    
    # Filter to marketing-relevant holidays only
    marketing_relevant = [
        h for h in holidays_on_date + upcoming_after_date
        if h.is_marketing_relevant
    ]
    
    return HolidayContext(
        date=target_date,
        holidays_on_date=holidays_on_date,
        upcoming_holidays=upcoming_after_date,
        marketing_relevant_holidays=marketing_relevant,
    )

