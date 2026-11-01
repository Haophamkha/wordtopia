import { api } from './client';

export interface ChatRow {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
}

export const aiApi = {
  chat: (message: string) =>
    api.post<{ reply: string }>('/ai/chat', { message }, { timeout: 60000 }).then((r) => r.data),
  history: () => api.get<ChatRow[]>('/ai/chat/history').then((r) => r.data),
  clear: () => api.delete('/ai/chat').then((r) => r.data),
};