"""Google Calendar service for scheduling posts."""
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Google Calendar API scopes
SCOPES = ['https://www.googleapis.com/auth/calendar']

# OAuth 2.0 client configuration
# These should be set in environment variables
CLIENT_ID = getattr(settings, 'GOOGLE_CLIENT_ID', None)
CLIENT_SECRET = getattr(settings, 'GOOGLE_CLIENT_SECRET', None)
REDIRECT_URI = getattr(settings, 'GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/google/callback')


def get_authorization_url() -> Dict[str, str]:
    """
    Get Google OAuth authorization URL.
    
    Returns:
        Dictionary with 'url' for the authorization URL
    """
    if not CLIENT_ID or not CLIENT_SECRET:
        raise ValueError("Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    
    return {
        "url": authorization_url,
        "state": state
    }


def get_credentials_from_code(code: str) -> Credentials:
    """
    Exchange authorization code for credentials.
    
    Args:
        code: Authorization code from OAuth callback
        
    Returns:
        Google OAuth credentials
    """
    if not CLIENT_ID or not CLIENT_SECRET:
        raise ValueError("Google OAuth credentials not configured.")
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI
    
    flow.fetch_token(code=code)
    return flow.credentials


def get_calendar_service(credentials_dict: Dict[str, Any]) -> Any:
    """
    Get Google Calendar service from stored credentials.
    
    Args:
        credentials_dict: Dictionary with token, refresh_token, etc.
        
    Returns:
        Google Calendar service object
    """
    credentials = Credentials.from_authorized_user_info(credentials_dict)
    return build('calendar', 'v3', credentials=credentials)


def create_calendar_event(
    service: Any,
    calendar_id: str,
    title: str,
    description: str,
    start_datetime: datetime,
    end_datetime: Optional[datetime] = None,
    location: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a calendar event.
    
    Args:
        service: Google Calendar service
        calendar_id: Calendar ID (use 'primary' for primary calendar)
        title: Event title
        description: Event description
        start_datetime: Event start time
        end_datetime: Event end time (defaults to 1 hour after start)
        location: Optional location
        
    Returns:
        Created event dictionary
    """
    if end_datetime is None:
        end_datetime = start_datetime + timedelta(hours=1)
    
    event = {
        'summary': title,
        'description': description,
        'start': {
            'dateTime': start_datetime.isoformat(),
            'timeZone': 'America/New_York',  # TODO: Make configurable
        },
        'end': {
            'dateTime': end_datetime.isoformat(),
            'timeZone': 'America/New_York',
        },
    }
    
    if location:
        event['location'] = location
    
    try:
        created_event = service.events().insert(
            calendarId=calendar_id,
            body=event
        ).execute()
        
        logger.info(f"Created calendar event: {created_event.get('id')}")
        return created_event
    except HttpError as e:
        logger.error(f"Error creating calendar event: {e}")
        raise


def list_calendar_events(
    service: Any,
    calendar_id: str,
    time_min: Optional[datetime] = None,
    time_max: Optional[datetime] = None,
    max_results: int = 50
) -> List[Dict[str, Any]]:
    """
    List calendar events.
    
    Args:
        service: Google Calendar service
        calendar_id: Calendar ID
        time_min: Minimum time (defaults to now)
        time_max: Maximum time (defaults to 30 days from now)
        max_results: Maximum number of results
        
    Returns:
        List of event dictionaries
    """
    if time_min is None:
        time_min = datetime.utcnow()
    if time_max is None:
        time_max = time_min + timedelta(days=30)
    
    try:
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=time_min.isoformat() + 'Z',
            timeMax=time_max.isoformat() + 'Z',
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        return events_result.get('items', [])
    except HttpError as e:
        logger.error(f"Error listing calendar events: {e}")
        raise


def schedule_post_to_calendar(
    credentials_dict: Dict[str, Any],
    calendar_id: str,
    post_title: str,
    post_description: str,
    scheduled_time: datetime,
    platforms: List[str]
) -> Dict[str, Any]:
    """
    Schedule a social media post to Google Calendar.
    
    Args:
        credentials_dict: Google OAuth credentials
        calendar_id: Calendar ID
        post_title: Post title/topic
        post_description: Post caption/description
        scheduled_time: When to post
        platforms: List of platforms (TikTok, Instagram)
        
    Returns:
        Created calendar event
    """
    service = get_calendar_service(credentials_dict)
    
    # Format title with platforms
    title = f"📱 Post: {post_title}"
    if platforms:
        title += f" ({', '.join(platforms)})"
    
    # Format description
    description = f"Social Media Post\n\n"
    description += f"Platforms: {', '.join(platforms)}\n\n"
    description += f"Caption:\n{post_description}"
    
    return create_calendar_event(
        service=service,
        calendar_id=calendar_id,
        title=title,
        description=description,
        start_datetime=scheduled_time,
        end_datetime=scheduled_time + timedelta(minutes=15),  # 15-minute event
    )


def get_calendars(credentials_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get list of user's calendars.
    
    Args:
        credentials_dict: Google OAuth credentials
        
    Returns:
        List of calendar dictionaries
    """
    service = get_calendar_service(credentials_dict)
    
    try:
        calendar_list = service.calendarList().list().execute()
        return calendar_list.get('items', [])
    except HttpError as e:
        logger.error(f"Error getting calendars: {e}")
        raise

