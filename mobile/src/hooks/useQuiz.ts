import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../api/quiz';
import { wordsApi } from '../api/words';

export const useQuiz = (deckId: number) =>
  useQuery({
    queryKey: ['quiz', deckId],
    queryFn: () => quizApi.get(deckId, 10),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    enabled: Number.isFinite(deckId),
  });

export function useSubmitQuiz(deckId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { answers: { wordId: number; selected: string }[]; durationSec: number }) =>
      quizApi.submit(deckId, v.answers, v.durationSec),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['deck'] });
    },
  });
}

export const useFavorites = () =>
  useQuery({ queryKey: ['favorites'], queryFn: () => import('../api/favorites').then((m) => m.favoritesApi.list()) });

export function useUnfavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wordId: number) => wordsApi.toggleFavorite(wordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['deck'] });
    },
  });
}