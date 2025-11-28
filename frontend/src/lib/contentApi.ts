import api from './api';

export interface ContentBrief {
  idea: string;
  platforms: string[];
  tone: string;
  length_seconds?: number | null;
  template_type?: string; // "image" or "video"
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

