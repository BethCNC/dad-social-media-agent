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
  visual_style?: 'pexels' | 'ai_generation'; // 'pexels' for stock videos, 'ai_generation' for AI images
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
    visual_style: request.visual_style || 'ai_generation', // Default to AI generation
  });
  return response.data;
};

export interface UserVideo {
  id: string;
  filename: string;
  original_filename: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  tags: string[];
  description?: string;
  use_count: number;
  last_used_at?: string;
  created_at: string;
}

/**
 * Upload a user video file.
 */
export const uploadVideo = async (
  file: File,
  tags?: string,
  description?: string
): Promise<{ id: string; video_url: string; filename: string; original_filename: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams();
  if (tags) params.append('tags', tags);
  if (description) params.append('description', description);

  const response = await api.post<{ id: string; video_url: string; filename: string; original_filename: string }>(
    `/api/assets/upload?${params.toString()}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * List all user-uploaded videos.
 */
export const listUserVideos = async (): Promise<UserVideo[]> => {
  const response = await api.get<UserVideo[]>('/api/assets/videos');
  return response.data;
};

/**
 * Delete a user-uploaded video.
 */
export const deleteUserVideo = async (videoId: number): Promise<void> => {
  await api.delete(`/api/assets/videos/${videoId}`);
};

/**
 * Regenerate a single image using Nano Banana Pro.
 */
export const regenerateImage = async (prompt: string): Promise<AssetResult> => {
  const response = await api.post<AssetResult>('/api/assets/regenerate-image', {
    prompt,
  });
  return response.data;
};

export interface UserImage {
  id: string;
  filename: string;
  image_url: string;
  thumbnail_url?: string;
  tags: string[];
  description?: string;
  use_count: number;
  source: string;
  created_at: string;
}

/**
 * Batch fetch/generate assets into library.
 */
export const populateAssets = async (
  type: 'video' | 'image',
  topic: string,
  count: number
): Promise<{ count: number; assets: any[] }> => {
  const response = await api.post('/api/assets/populate', {
    type,
    topic,
    count,
  });
  return response.data;
};

export const listUserImages = async (): Promise<UserImage[]> => {
  const response = await api.get<UserImage[]>('/api/assets/images');
  return response.data;
};

export const deleteUserImage = async (imageId: number): Promise<void> => {
  await api.delete(`/api/assets/images/${imageId}`);
};

