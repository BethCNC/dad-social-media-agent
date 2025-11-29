"""Google Calendar API routes."""
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

from app.services.calendar_service import (
    get_authorization_url,
    get_credentials_from_code,
    schedule_post_to_calendar,
    list_calendar_events,
    get_calendars,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class CalendarAuthRequest(BaseModel):
    """Request to get authorization URL."""
    pass


class CalendarAuthCallback(BaseModel):
    """OAuth callback with authorization code."""
    code: str


class CalendarCredentials(BaseModel):
    """Stored Google Calendar credentials."""
    token: str
    refresh_token: Optional[str] = None
    token_uri: str
    client_id: str
    client_secret: str
    scopes: List[str]


class ScheduleToCalendarRequest(BaseModel):
    """Request to schedule a post to Google Calendar."""
    credentials: CalendarCredentials
    calendar_id: str = "primary"
    post_title: str
    post_description: str
    scheduled_time: str  # ISO datetime string
    platforms: List[str]


@router.get("/auth/url")
async def get_auth_url() -> Dict[str, str]:
    """
    Get Google OAuth authorization URL.
    
    Returns:
        Dictionary with 'url' for authorization
    """
    try:
        return get_authorization_url()
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting auth URL: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get authorization URL"
        )


@router.post("/auth/callback")
async def handle_auth_callback(request: CalendarAuthCallback) -> CalendarCredentials:
    """
    Exchange authorization code for credentials.
    
    Args:
        request: OAuth callback with code
        
    Returns:
        Calendar credentials
    """
    try:
        credentials = get_credentials_from_code(request.code)
        
        return CalendarCredentials(
            token=credentials.token,
            refresh_token=credentials.refresh_token,
            token_uri=credentials.token_uri,
            client_id=credentials.client_id,
            client_secret=credentials.client_secret,
            scopes=credentials.scopes,
        )
    except Exception as e:
        logger.error(f"Error handling auth callback: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to exchange authorization code"
        )


@router.get("/calendars")
async def list_user_calendars(
    credentials: CalendarCredentials = Body(...)
) -> List[Dict[str, Any]]:
    """
    Get list of user's calendars.
    
    Args:
        credentials: Google OAuth credentials
        
    Returns:
        List of calendars
    """
    try:
        credentials_dict = credentials.model_dump()
        return get_calendars(credentials_dict)
    except Exception as e:
        logger.error(f"Error listing calendars: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to list calendars"
        )


@router.post("/schedule")
async def schedule_post_calendar(request: ScheduleToCalendarRequest) -> Dict[str, Any]:
    """
    Schedule a post to Google Calendar.
    
    Args:
        request: Schedule request with credentials, calendar, and post details
        
    Returns:
        Created calendar event
    """
    try:
        scheduled_time = datetime.fromisoformat(request.scheduled_time.replace('Z', '+00:00'))
        
        credentials_dict = request.credentials.model_dump()
        event = schedule_post_to_calendar(
            credentials_dict=credentials_dict,
            calendar_id=request.calendar_id,
            post_title=request.post_title,
            post_description=request.post_description,
            scheduled_time=scheduled_time,
            platforms=request.platforms,
        )
        
        return {
            "event_id": event.get('id'),
            "html_link": event.get('htmlLink'),
            "status": "success"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error scheduling to calendar: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to schedule post to calendar"
        )


@router.get("/events")
async def get_calendar_events(
    credentials: CalendarCredentials = Body(...),
    calendar_id: str = "primary",
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Get calendar events.
    
    Args:
        credentials: Google OAuth credentials
        calendar_id: Calendar ID
        time_min: Start time (ISO string)
        time_max: End time (ISO string)
        
    Returns:
        List of events
    """
    try:
        credentials_dict = credentials.model_dump()
        from app.services.calendar_service import get_calendar_service
        service = get_calendar_service(credentials_dict)
        
        time_min_dt = datetime.fromisoformat(time_min.replace('Z', '+00:00')) if time_min else None
        time_max_dt = datetime.fromisoformat(time_max.replace('Z', '+00:00')) if time_max else None
        
        return list_calendar_events(
            service=service,
            calendar_id=calendar_id,
            time_min=time_min_dt,
            time_max=time_max_dt,
        )
    except Exception as e:
        logger.error(f"Error getting calendar events: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get calendar events"
        )

