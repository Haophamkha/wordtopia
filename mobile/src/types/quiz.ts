export interface QuizQuestion {
  wordId: number;
  term: string;
  phonetic?: string | null;
  options: string[];
}

export interface QuizData {
  deckId: number;
  total: number;
  questions: QuizQuestion[];
}

export interface QuizResultItem {
  wordId: number;
  term: string;
  selected: string;
  correctMeaning: string;
  isCorrect: boolean;
}

export interface QuizResult {
  attemptId: number;
  total: number;
  correct: number;
  score: number;
  results: QuizResultItem[];
}