import { useMutation, useQueryClient } from '@tanstack/react-query';
import { manageApi, type DeckInput, type WordInput } from '../api/manage';

function useRefresh(deckId?: number) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['decks'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
    qc.invalidateQueries({ queryKey: ['favorites'] });
    if (deckId) qc.invalidateQueries({ queryKey: ['deck', deckId] });
    else qc.invalidateQueries({ queryKey: ['deck'] });
  };
}

export function useCreateDeck() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (dto: DeckInput) => manageApi.createDeck(dto), onSuccess: refresh });
}

export function useDeleteDeck() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (id: number) => manageApi.deleteDeck(id), onSuccess: refresh });
}

export function useSaveWord(deckId: number, wordId?: number) {
  const refresh = useRefresh(deckId);
  return useMutation({
    mutationFn: (dto: WordInput) =>
      wordId ? manageApi.updateWord(wordId, dto) : manageApi.createWord(deckId, dto),
    onSuccess: refresh,
  });
}

export function useDeleteWord(deckId: number) {
  const refresh = useRefresh(deckId);
  return useMutation({ mutationFn: (id: number) => manageApi.deleteWord(id), onSuccess: refresh });
}