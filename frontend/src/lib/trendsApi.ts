import api from './api';
import type { TrendAlert } from '@/components/trends/TrendAlertCard';

/**
 * Fetch latest trending content analysis.
 */
export const getLatestTrends = async (
  hashtag?: string,
  maxVideos: number = 10
): Promise<TrendAlert> => {
  const params: Record<string, string | number> = {};
  if (hashtag) params.hashtag = hashtag;
  if (maxVideos) params.max_videos = maxVideos;
  
  const response = await api.get<TrendAlert>('/api/trends/latest', {
    params,
  });
  return response.data;
};

