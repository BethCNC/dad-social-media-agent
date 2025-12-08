import api from './api';

export interface KnowledgeItem {
    id: number;
    content: string;
    source?: string;
    category?: string;
    created_at: string;
}

export interface KnowledgeItemCreate {
    content: string;
    source?: string;
    category?: string;
}

export interface SearchResult extends KnowledgeItem {
    score: number;
}

export const getKnowledgeItems = async (): Promise<KnowledgeItem[]> => {
    const response = await api.get('/knowledge/');
    return response.data;
};

export const addKnowledgeItem = async (data: KnowledgeItemCreate): Promise<KnowledgeItem> => {
    const response = await api.post('/knowledge/', data);
    return response.data;
};

export const deleteKnowledgeItem = async (id: number): Promise<void> => {
    await api.delete(`/knowledge/${id}`);
};

export const searchKnowledge = async (query: string): Promise<SearchResult[]> => {
    const response = await api.post('/knowledge/search', { query, limit: 5 });
    return response.data;
};

export interface SmartIngestResponse {
    items_added: number;
    items: KnowledgeItem[];
}

export const smartIngest = async (rawInput: string, source?: string): Promise<SmartIngestResponse> => {
    const response = await api.post('/knowledge/ingest', {
        raw_input: rawInput,
        source
    });
    return response.data;
};
