"""Holiday models for Pydantic schemas."""
from pydantic import BaseModel
from datetime import date
from typing import Optional


class Holiday(BaseModel):
    """Holiday model for API responses."""
    id: str
    date: date
    name: str
    source: str
    category: Optional[str] = None
    is_marketing_relevant: bool = True


class HolidayContext(BaseModel):
    """Holiday context for a specific date."""
    date: date
    holidays_on_date: list[Holiday]
    upcoming_holidays: list[Holiday]  # Within window_days
    marketing_relevant_holidays: list[Holiday]  # Filtered to marketing-relevant only

