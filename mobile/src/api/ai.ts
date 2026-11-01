import { api } from './client';

export const aiApi = {
  chat: (message: string) =>
    api.post<{ reply: string }>('/ai/chat', { message }, { timeout: 60000 }).then((r) => r.data),
};