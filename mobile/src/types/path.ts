export interface LessonSummary {
  id: number;
  order: number;
  title: string;
  type?: 'VOCAB' | 'GRAMMAR' | 'CHECKPOINT' | 'VIDEO';
  wordCount: number;
  stars: number;
  completed: boolean;
  locked: boolean;
}

export interface UnitSummary {
  id: number;
  level: string;
  order: number;
  title: string;
  titleVi: string;
  emoji: string;
  lessons: LessonSummary[];
  completedLessons: number;
  totalLessons: number;
}

export interface PathResponse {
  level: string;
  nextLessonId: number | null;
  totalLessons: number;
  completedLessons: number;
  units: UnitSummary[];
}