import api from './api';
import type { ShotInstruction } from './contentApi';

export interface ScheduleRequest {
  start_date: string; // ISO date
  platforms: string[];
  posts_per_week: number;
}

export interface ScheduledContentItem {
  date: string;
  day_of_week: string;
  content_pillar: string;
  series_name?: string | null;
  topic: string;
  hook: string;
  script: string;
  caption: string;
  shot_plan: ShotInstruction[];
  suggested_keywords: string[];
  template_type: string;
}

export interface MonthlySchedule {
  start_date: string;
  end_date: string;
  items: ScheduledContentItem[];
  series_breakdown: Record<string, number>;
}

export const generateMonthlySchedule = async (
  request: ScheduleRequest
): Promise<MonthlySchedule> => {
  const response = await api.post<MonthlySchedule>('/api/schedule/monthly', request);
  return response.data;
};

