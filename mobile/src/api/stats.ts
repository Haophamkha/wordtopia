import type { Overview } from '../types';
import { api } from './client';

export interface WeeklyDay {
  date: string;
  wordsLearned: number;
  wordsReview: number;
  total: number;
}

export const statsApi = {
  overview: () => api.get<Overview>('/stats/overview').then((r) => r.data),
  weekly: () => api.get<WeeklyDay[]>('/stats/weekly').then((r) => r.data),
};