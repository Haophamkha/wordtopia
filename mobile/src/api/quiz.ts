import type { QuizData, QuizResult } from '../types/quiz';
import { api } from './client';

export const quizApi = {
  get: (deckId: number, count = 10) =>
    api.get<QuizData>(`/quiz/${deckId}`, { params: { count } }).then((r) => r.data),
  submit: (deckId: number, answers: { wordId: number; selected: string }[], durationSec: number) =>
    api.post<QuizResult>(`/quiz/${deckId}/submit`, { answers, durationSec }).then((r) => r.data),
};