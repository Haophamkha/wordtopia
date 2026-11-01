import type { Overview } from '../types';
import { api } from './client';

export const statsApi = {
  overview: () => api.get<Overview>('/stats/overview').then((r) => r.data),
};