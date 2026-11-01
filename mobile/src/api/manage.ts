import type { Deck, Difficulty } from '../types/deck';
import { api } from './client';

export interface DeckInput {
  title: string;
  description?: string;
  topic?: string;
  emoji?: string;
  difficulty?: Difficulty;
  isPublic?: boolean;
}

export interface WordInput {
  term: string;
  meaning: string;
  phonetic?: string;
  example?: string;
  exampleMeaning?: string;
}

export const manageApi = {
  createDeck: (dto: DeckInput) => api.post<Deck>('/decks', dto).then((r) => r.data),
  deleteDeck: (id: number) => api.delete(`/decks/${id}`).then((r) => r.data),
  createWord: (deckId: number, dto: WordInput) => api.post(`/decks/${deckId}/words`, dto).then((r) => r.data),
  updateWord: (id: number, dto: Partial<WordInput>) => api.patch(`/words/${id}`, dto).then((r) => r.data),
  deleteWord: (id: number) => api.delete(`/words/${id}`).then((r) => r.data),
};