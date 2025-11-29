/** Weekly schedule API client. */
import api from './api';
import type { ShotInstruction } from './contentApi';

export interface WeeklyScheduleRequest {
  week_start_date: string; // ISO date (Monday of the week)
  platforms: string[];
}

export interface WeeklyPost {
  id?: number;
  post_date: string; // ISO date
  post_time?: string | null; // ISO time
  content_pillar: string; // education, routine, story, product_integration
  series_name?: string | null;
  topic: string;
  hook: string;
  script: string;
  caption: string;
  template_type: string; // "image" or "video"
  shot_plan: ShotInstruction[];
  suggested_keywords: string[];
  status: string; // draft, ready, scheduled, published
  media_url?: string | null;
}

export interface WeeklySchedule {
  id?: number;
  week_start_date: string; // ISO date
  week_end_date: string; // ISO date
  posts: WeeklyPost[];
  series_breakdown: Record<string, number>;
  status?: string | null;
}

/**
 * Generate a weekly schedule with 7 posts.
 */
export const generateWeeklySchedule = async (
  request: WeeklyScheduleRequest
): Promise<WeeklySchedule> => {
  const response = await api.post<WeeklySchedule>('/api/weekly/generate', request);
  return response.data;
};

/**
 * Get existing weekly schedule for a given week.
 */
export const getWeeklySchedule = async (
  weekDate: string // Any date in the week (ISO format)
): Promise<WeeklySchedule> => {
  const response = await api.get<WeeklySchedule>(`/api/weekly/${weekDate}`);
  return response.data;
};

/**
 * Update an individual post in the weekly schedule.
 */
export const updatePost = async (
  postId: number,
  post: WeeklyPost
): Promise<WeeklyPost> => {
  const response = await api.put<WeeklyPost>(`/api/weekly/posts/${postId}`, post);
  return response.data;
};

/**
 * Get a single post by ID.
 */
export const getPostById = async (
  postId: number
): Promise<WeeklyPost> => {
  const response = await api.get<WeeklyPost>(`/api/weekly/posts/${postId}`);
  return response.data;
};

/**
 * Regenerate text content for a post using content database.
 */
export const regeneratePostText = async (
  postId: number
): Promise<WeeklyPost> => {
  const response = await api.post<WeeklyPost>(`/api/weekly/posts/${postId}/regenerate-text`);
  return response.data;
};

/**
 * Manually trigger preview rendering for a post.
 */
export const renderPostPreview = async (
  postId: number
): Promise<WeeklyPost> => {
  const response = await api.post<WeeklyPost>(`/api/weekly/posts/${postId}/render-preview`);
  return response.data;
};

