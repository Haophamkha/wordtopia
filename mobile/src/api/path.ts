import type { CompleteResult, Lesson, Placement } from '../types/lesson';
import type { PathResponse } from '../types/path';
import { api } from './client';

export const pathApi = {
  get: () => api.get<PathResponse>('/path').then((r) => r.data),
  lesson: (id: number) => api.get<Lesson>(`/path/lessons/${id}`).then((r) => r.data),
  complete: (id: number, answers: { wordId: number; correct: boolean }[], durationSec: number) =>
    api.post<CompleteResult>(`/path/lessons/${id}/complete`, { answers, durationSec }).then((r) => r.data),
  placement: () => api.get<Placement>('/path/placement').then((r) => r.data),
  submitPlacement: (answers: { wordId: number; selected: string }[]) =>
    api.post('/path/placement', { answers }).then((r) => r.data),
};