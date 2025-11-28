import api from './api';

export interface AssetResult {
  id: string;
  thumbnail_url: string;
  video_url: string;
  duration_seconds: number;
}

export const searchAssets = async (
  query: string,
  maxResults: number = 10
): Promise<AssetResult[]> => {
  const response = await api.get<AssetResult[]>('/api/assets/search', {
    params: { query, max_results: maxResults },
  });
  return response.data;
};

