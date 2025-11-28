import api from './api';

export interface ScheduleRequest {
  video_url: string;
  caption: string;
  platforms: string[];
  scheduled_time?: string | null;
}

export interface ScheduleResponse {
  provider_id: string;
  status: string;
  external_links?: string[] | null;
}

export const schedulePost = async (request: ScheduleRequest): Promise<ScheduleResponse> => {
  const response = await api.post<ScheduleResponse>('/api/social/schedule', request);
  return response.data;
};

