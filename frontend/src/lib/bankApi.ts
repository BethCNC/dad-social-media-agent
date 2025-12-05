import api from './api';

export type BankStatus = 'draft' | 'approved' | 'archived';

export interface BankItem {
  id: number;
  // Core creative fields
  title: string;
  script: string;
  caption: string;
  content_pillar: string;
  tone: string;
  length_seconds?: number | null;

  // Lifecycle & provenance
  status: BankStatus;
  created_from: 'manual' | 'ai_batch' | 'import';

  // Diversity / series metadata
  topic_cluster?: string | null;
  series_name?: string | null;
  target_problem?: string | null;

  // Media / render state
  voiceover_url?: string | null;
  primary_asset_url?: string | null;
  secondary_asset_url?: string | null;
  rendered_video_url?: string | null;
  last_render_status?: string | null;

  // Usage & basic analytics
  times_used: number;
  last_used_at?: string | null;
  posted_at?: string | null;
  platforms?: string | null;
  performance_notes?: string | null;

  created_at: string;
  updated_at: string;
}

export interface BankItemFilters {
  search?: string;
  status?: BankStatus;
  content_pillar?: string;
  tone?: string;
  min_length_seconds?: number;
  max_length_seconds?: number;
  limit?: number;
  prioritize_unused?: boolean;
}

export const fetchBankItems = async (filters: BankItemFilters = {}): Promise<BankItem[]> => {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.content_pillar) params.set('content_pillar', filters.content_pillar);
  if (filters.tone) params.set('tone', filters.tone);
  if (typeof filters.min_length_seconds === 'number') {
    params.set('min_length_seconds', String(filters.min_length_seconds));
  }
  if (typeof filters.max_length_seconds === 'number') {
    params.set('max_length_seconds', String(filters.max_length_seconds));
  }
  if (typeof filters.limit === 'number') {
    params.set('limit', String(filters.limit));
  }
  if (filters.prioritize_unused) {
    params.set('prioritize_unused', 'true');
  }

  const query = params.toString();
  const url = `/api/content/bank${query ? `?${query}` : ''}`;

  const response = await api.get<BankItem[]>(url);
  return response.data;
};

export const updateBankItem = async (itemId: number, updates: Partial<BankItem>): Promise<BankItem> => {
  const response = await api.patch<BankItem>(`/api/content/bank/${itemId}`, updates);
  return response.data;
};

export const generateVoiceover = async (itemId: number): Promise<BankItem> => {
  const response = await api.post<BankItem>(`/api/content/bank/${itemId}/voiceover`);
  return response.data;
};

export const renderFromBank = async (itemId: number, templateType: string = 'video'): Promise<{ job_id: string; status: string; video_url?: string | null }> => {
  const response = await api.post<{ job_id: string; status: string; video_url?: string | null }>(
    `/api/video/render-from-bank/${itemId}?template_type=${templateType}`
  );
  return response.data;
};
