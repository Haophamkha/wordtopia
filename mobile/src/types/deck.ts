export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Deck {
  id: number;
  title: string;
  description?: string | null;
  topic?: string | null;
  emoji?: string | null;
  difficulty: Difficulty;
  isPublic: boolean;
  ownerId: number;
  createdAt: string;
  _count?: { words: number };
}