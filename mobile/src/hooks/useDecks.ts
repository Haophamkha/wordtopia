import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { decksApi } from '../api/decks';
import type { Difficulty } from '../types/deck';

export const useDecks = (q: string) =>
  useQuery({ queryKey: ['decks', 'list', q], queryFn: () => decksApi.list(q) });

export const useMyDecks = () =>
  useQuery({ queryKey: ['decks', 'mine'], queryFn: decksApi.mine });

export function useGenerateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { topic: string; count: number; level: Difficulty }) =>
      decksApi.generate(v.topic, v.count, v.level),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decks'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}