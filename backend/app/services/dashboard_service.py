"""Dashboard service for daily briefing and aggregated insights."""
import logging
from datetime import date
from typing import Dict, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.services.trend_service import fetch_trending_videos, get_relevant_hashtags
from app.services.weekly_schedule_service import get_weekly_schedule
from app.services.holiday_service import get_holiday_context_for_date
from app.services.gemini_client import analyze_social_trend
from app.database.database import SessionLocal

logger = logging.getLogger(__name__)


async def get_daily_briefing(target_date: Optional[date] = None, db: Optional[Session] = None) -> Dict:
    """
    Get daily briefing for Myles Hub: aggregated context + suggested action.
    
    Aggregates:
    - Current date
    - Daily content theme (from weekly schedule)
    - Upcoming holidays
    - Trend hook (from trending TikTok videos)
    
    Args:
        target_date: Date to generate briefing for (defaults to today)
        db: Optional database session
        
    Returns:
        Dictionary with greeting, suggested_action, trend_alert, stats
    """
    if target_date is None:
        target_date = date.today()
    
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
    try:
        # 1. Get current date info
        from datetime import datetime
        current_date_str = target_date.strftime("%A, %B %d, %Y")
        
        # 2. Get daily content theme from weekly schedule
        daily_theme = "Educational Content"  # Default
        try:
            # Find the Monday of this week
            from datetime import timedelta
            days_since_monday = target_date.weekday()
            week_monday = target_date - timedelta(days=days_since_monday)
            
            # Get weekly schedule (may raise HTTPException if not found - that's okay)
            try:
                weekly_schedule = await get_weekly_schedule(week_monday, db)
                
                # Find today's post
                today_post = None
                for post in weekly_schedule.posts:
                    if post.post_date == target_date:
                        today_post = post
                        break
                
                if today_post:
                    # Use series name or content pillar as theme
                    if today_post.series_name:
                        daily_theme = today_post.series_name
                    else:
                        # Map content pillar to theme
                        pillar_map = {
                            "education": "Educational Content",
                            "routine": "Routine & Habits",
                            "story": "Story-Based Content",
                            "product_integration": "Product Integration"
                        }
                        daily_theme = pillar_map.get(today_post.content_pillar, "Educational Content")
            except HTTPException:
                # No schedule exists yet - use default theme
                logger.info(f"No weekly schedule found for week starting {week_monday}, using default theme")
        except Exception as e:
            logger.warning(f"Could not load daily theme from schedule: {e}")
            # Keep default theme
        
        # 3. Get upcoming holidays
        upcoming_holidays = []
        try:
            holiday_context = get_holiday_context_for_date(target_date, window_days=14, db=db)
            
            for holiday in holiday_context.marketing_relevant_holidays[:3]:  # Top 3
                upcoming_holidays.append({
                    "name": holiday.name,
                    "date": str(holiday.date),
                })
        except Exception as e:
            logger.warning(f"Could not load holidays: {e}")
            # Continue without holidays
        
        # 4. Get trend hook from trending videos
        trend_alert = None
        try:
            # Fetch trending videos from multiple hashtags using aggregated function
            from app.services.trend_service import fetch_trending_videos_multiple_hashtags
            all_videos = fetch_trending_videos_multiple_hashtags(
                hashtags=["feelgreatsystem", "unicity", "insulinresistance"],
                max_results=10
            )
            
            if all_videos:
                # Extract captions for trend analysis
                captions = [v.get("caption", "") for v in all_videos if v.get("caption")]
                
                if captions:
                    # Use Gemini to analyze trends and generate a compliant hook
                    trend_analysis = await analyze_social_trend(captions)
                    
                    trend_alert = {
                        "title": trend_analysis.get("trend_title", "Trending Now"),
                        "why_it_works": trend_analysis.get("why_it_works", ""),
                        "hook_script": trend_analysis.get("hook_script", ""),
                        "suggested_caption": trend_analysis.get("suggested_caption", ""),
                    }
        except Exception as e:
            logger.warning(f"Could not generate trend alert: {e}")
            # trend_alert stays None
        
        # 5. Generate suggested action
        suggested_action = _generate_suggested_action(
            target_date=target_date,
            daily_theme=daily_theme,
            upcoming_holidays=upcoming_holidays,
            trend_alert=trend_alert
        )
        
        # 6. Build greeting
        from datetime import datetime
        hour = datetime.now().hour
        if hour < 12:
            greeting = "Good Morning, Myles"
        elif hour < 17:
            greeting = "Good Afternoon, Myles"
        else:
            greeting = "Good Evening, Myles"
        
        # 7. Build stats (placeholder for now)
        stats = {
            "posts_this_week": 0,
            "scheduled_posts": 0,
            "engagement_rate": None,
        }
        
        return {
            "greeting": greeting,
            "current_date": current_date_str,
            "daily_theme": daily_theme,
            "suggested_action": suggested_action,
            "upcoming_holidays": upcoming_holidays,
            "trend_alert": trend_alert,
            "stats": stats,
        }
        
    finally:
        if should_close:
            db.close()


def _generate_suggested_action(
    target_date: date,
    daily_theme: str,
    upcoming_holidays: list,
    trend_alert: Optional[Dict]
) -> str:
    """
    Generate a suggested action string based on daily context.
    
    Args:
        target_date: Target date
        daily_theme: Daily content theme
        upcoming_holidays: List of upcoming holidays
        trend_alert: Optional trend alert data
        
    Returns:
        Suggested action string
    """
    # If we have a trend alert, suggest using it
    if trend_alert:
        return f"Share a post about {trend_alert.get('title', 'this trending topic')}"
    
    # If we have an upcoming holiday, suggest holiday content
    if upcoming_holidays:
        holiday = upcoming_holidays[0]
        return f"Create content about {holiday['name']}"
    
    # Use daily theme
    if "Educational" in daily_theme:
        return "Share an educational tip about wellness"
    elif "Routine" in daily_theme:
        return "Share a routine or habit that helps you feel great"
    elif "Story" in daily_theme:
        return "Share a personal story about your wellness journey"
    elif "Product" in daily_theme:
        return "Share how products fit into your daily routine"
    
    # Default
    return "Create a post about your wellness journey"

