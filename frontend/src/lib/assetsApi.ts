import api from './api';
import type { ShotInstruction } from './contentApi';

export interface AssetResult {
  id: string;
  thumbnail_url: string;
  video_url: string;
  duration_seconds: number;
}

export interface ContextualSearchRequest {
  topic: string;
  hook: string;
  script: string;
  shot_plan: ShotInstruction[];
  content_pillar: string;
  suggested_keywords?: string[];
  max_results?: number;
}

/**
 * Simple search for assets (backward compatible).
 */
export const searchAssets = async (
  query: string,
  maxResults: number = 10
): Promise<AssetResult[]> => {
  const response = await api.get<AssetResult[]>('/api/assets/search', {
    params: { query, max_results: maxResults },
  });
  return response.data;
};

/**
 * Context-aware search using post content for better relevance.
 * Uses topic, hook, script, shot plan, and content pillar to find
 * the most relevant assets.
 */
export const searchAssetsContextual = async (
  request: ContextualSearchRequest
): Promise<AssetResult[]> => {
  const response = await api.post<AssetResult[]>('/api/assets/search/contextual', {
    topic: request.topic,
    hook: request.hook,
    script: request.script,
    shot_plan: request.shot_plan,
    content_pillar: request.content_pillar,
    suggested_keywords: request.suggested_keywords || [],
    max_results: request.max_results || 12,
  });
  return response.data;
};

