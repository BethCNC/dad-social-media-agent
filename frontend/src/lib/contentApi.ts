import api from './api';

export interface ContentBrief {
  // Mode: "manual" = user provides topic, "auto" = AI suggests topic
  mode?: 'manual' | 'auto';
  
  // For manual mode: user provides their own topic
  user_topic?: string | null;
  
  // For auto mode: use holidays to suggest topics
  use_holidays?: boolean;
  selected_holiday_id?: string | null;
  
  // Legacy field: kept for backward compatibility (maps to user_topic when mode="manual")
  idea?: string | null;
  
  platforms: string[];
  tone: string;
  length_seconds?: number | null;
  template_type?: string; // "image" or "video"
  
  // Optional: target date for content (used for holiday context)
  target_date?: string | null; // ISO date string (YYYY-MM-DD)
}

export interface ShotInstruction {
  description: string;
  duration_seconds: number;
}

export interface GeneratedPlan {
  script: string;
  caption: string;
  shot_plan: ShotInstruction[];
}

export const generatePlan = async (brief: ContentBrief): Promise<GeneratedPlan> => {
  const response = await api.post<GeneratedPlan>('/api/content/plan', brief);
  return response.data;
};

