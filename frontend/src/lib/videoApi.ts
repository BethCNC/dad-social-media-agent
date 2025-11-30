import api from './api';

export interface AssetSelection {
  id: string;
  start_at?: number | null;
  end_at?: number | null;
}

export interface VideoRenderRequest {
  assets: AssetSelection[];
  script: string;
  title?: string | null;
  template_type?: string; // "image" or "video"
}

export interface RenderJob {
  job_id: string;
  status: string;
  video_url?: string | null;
  error_message?: string | null;
}

export const renderVideo = async (request: VideoRenderRequest): Promise<RenderJob> => {
  const response = await api.post<RenderJob>('/api/video/render', request);
  return response.data;
};

export const getRenderStatus = async (jobId: string): Promise<RenderJob> => {
  const response = await api.get<RenderJob>(`/api/video/render/${jobId}/status`);
  return response.data;
};

/**
 * Render a quick preview using Creatomate template.
 * Used for showing previews when user selects alternative assets.
 */
export const renderPreview = async (request: VideoRenderRequest): Promise<RenderJob> => {
  const response = await api.post<RenderJob>('/api/video/render/preview', request);
  return response.data;
};

