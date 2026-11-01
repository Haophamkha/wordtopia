import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wordsApi } from '../api/words';

export const useDeck = (id: number) =>
  useQuery({ queryKey: ['deck', id], queryFn: () => wordsApi.deck(id), enabled: Number.isFinite(id) });

export function useToggleFavorite(deckId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wordId: number) => wordsApi.toggleFavorite(wordId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deck', deckId] }),
  });
}

export const useStudySession = (deckId?: number) =>
  useQuery({
    queryKey: ['study', 'session', deckId ?? 'all'],
    queryFn: () => wordsApi.session(deckId, 20),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

export function useReview() {
  return useMutation({
    mutationFn: (v: { wordId: number; correct: boolean }) => wordsApi.review(v.wordId, v.correct),
  });
}