import type { DeckDetail, Word } from '../types/word';
import { api } from './client';

export const wordsApi = {
  deck: (id: number) => api.get<DeckDetail>(`/decks/${id}`).then((r) => r.data),
  toggleFavorite: (wordId: number) => api.post(`/words/${wordId}/favorite`).then((r) => r.data),
  session: (deckId?: number, limit = 20) =>
    api.get<Word[]>('/study/session', { params: { deckId, limit } }).then((r) => r.data),
  review: (wordId: number, correct: boolean) =>
    api.post('/study/review', { wordId, correct }).then((r) => r.data),
};