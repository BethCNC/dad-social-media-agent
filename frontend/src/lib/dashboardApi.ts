import api from './api';

export interface DailyBriefing {
  greeting: string;
  current_date: string;
  daily_theme: string;
  suggested_action: string;
  upcoming_holidays: Array<{
    name: string;
    date: string;
  }>;
  trend_alert: TrendAlert | null;
  stats: {
    posts_this_week: number;
    scheduled_posts: number;
    engagement_rate: number | null;
  };
}

export interface TrendAlert {
  title: string;
  why_it_works: string;
  hook_script: string;
  suggested_caption: string;
}

/**
 * Get daily briefing for Myles Hub.
 */
export async function getDailyBriefing(targetDate?: string): Promise<DailyBriefing> {
  const params = targetDate ? { target_date: targetDate } : {};
  const response = await api.get('/api/dashboard/briefing', { params });
  return response.data;
}

