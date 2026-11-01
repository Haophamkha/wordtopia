export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string | null;
  dailyGoal?: number;
  streak?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Overview {
  streak: number;
  longestStreak: number;
  dailyGoal: number;
  todayLearned: number;
  todayReviewed: number;
  totalLearned: number;
  mastered: number;
  dueToday: number;
  quizCount: number;
  avgScore: number;
}