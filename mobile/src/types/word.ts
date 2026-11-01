import type { Deck } from './deck';

export interface Word {
  id: number;
  deckId: number;
  term: string;
  meaning: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  example?: string | null;
  exampleMeaning?: string | null;
  imageUrl?: string | null;
  isFavorite: boolean;
  level: number;
  isNew?: boolean;
}

export interface DeckDetail extends Deck {
  words: Word[];
}