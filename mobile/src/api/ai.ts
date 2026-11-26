import { api } from './client';

export interface ChatRow {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
}

export interface WritingResult {
  original: string;
  corrected: string;
  better: string | null;
  score: number | null;
  summaryVi: string;
  mistakes: { original: string; fix: string; explanationVi: string }[];
}

export const aiApi = {
  chat: (message: string) =>
    api.post<{ reply: string }>('/ai/chat', { message }, { timeout: 60000 }).then((r) => r.data),
  explainMistake: (b: { question: string; answer: string; picked?: string }) =>
    api.post<{ explanation: string }>('/ai/explain-mistake', b, { timeout: 60000 }).then((r) => r.data),
  correctWriting: (text: string) =>
    api.post<WritingResult>('/ai/correct-writing', { text }, { timeout: 60000 }).then((r) => r.data),
  history: () => api.get<ChatRow[]>('/ai/chat/history').then((r) => r.data),
  clear: () => api.delete('/ai/chat').then((r) => r.data),
};