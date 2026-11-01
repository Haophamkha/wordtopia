import type { Word } from '../types/word';
import { api } from './client';

export const favoritesApi = {
  list: () => api.get<Word[]>('/words/favorites').then((r) => r.data),
};