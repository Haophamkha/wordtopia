import type { Deck, Difficulty } from '../types/deck';
import { api } from './client';

export const decksApi = {
  list: (q?: string, topic?: string) =>
    api.get<Deck[]>('/decks', { params: { q: q || undefined, topic: topic || undefined } }).then((r) => r.data),
  mine: () => api.get<Deck[]>('/decks/mine').then((r) => r.data),
  generate: (topic: string, count: number, level: Difficulty) =>
    api.post<Deck>('/ai/generate-deck', { topic, count, level }, { timeout: 90000 }).then((r) => r.data),
};