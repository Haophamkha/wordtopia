export interface LessonWord {
  id: number;
  term: string;
  meaning: string;
  phonetic?: string | null;
  partOfSpeech?: string;
  example?: string | null;
  exampleMeaning?: string | null;
  synonym?: string | null;
}

export type Exercise =
  | { id: string; type: 'match_pairs'; pairs: { wordId: number; term: string; meaning: string }[] }
  | { id: string; type: 'choose_meaning'; wordId: number; term: string; phonetic?: string | null; options: string[]; answer: string }
  | { id: string; type: 'listen_choose'; wordId: number; term: string; options: string[]; answer: string }
  | { id: string; type: 'fill_blank'; wordId: number; sentence: string; translation: string; options: string[]; answer: string }
  | { id: string; type: 'order_sentence'; wordId: number; translation: string; tokens: string[]; answer: string }
  | { id: string; type: 'synonym'; wordId: number; term: string; options: string[]; answer: string }
  | { id: string; type: 'type_word'; wordId: number; meaning: string; hint?: string; answer: string };

export interface Lesson {
  id: number;
  title: string;
  unit: { id: number; level: string; title: string; titleVi: string; emoji: string };
  words: LessonWord[];
  exercises: Exercise[];
}

export interface CompleteResult {
  stars?: number;
  nextLessonId?: number | null;
}

export interface PlacementQuestion {
  wordId: number;
  level: string;
  term: string;
  phonetic?: string | null;
  options: string[];
}

export interface Placement {
  total: number;
  questions: PlacementQuestion[];
}