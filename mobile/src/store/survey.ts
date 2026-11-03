import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export interface SurveyAnswers {
  purpose: string;
  selfLevel: string;
  dailyGoal: number;
}

interface SurveyState {
  loadedFor: number | null;
  done: boolean;
  answers: SurveyAnswers | null;
  load: (userId: number) => Promise<void>;
  save: (userId: number, answers: SurveyAnswers | null) => Promise<void>;
}

const keyOf = (userId: number) => `wordtopia_survey_${userId}`;

export const useSurveyStore = create<SurveyState>((set, get) => ({
  loadedFor: null,
  done: false,
  answers: null,

  load: async (userId) => {
    if (get().loadedFor === userId) return;
    let done = false;
    let answers: SurveyAnswers | null = null;
    try {
      const raw = await SecureStore.getItemAsync(keyOf(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as { done: boolean; answers: SurveyAnswers | null };
        done = !!parsed.done;
        answers = parsed.answers ?? null;
      }
    } catch {}
    set({ loadedFor: userId, done, answers });
  },

  save: async (userId, answers) => {
    set({ loadedFor: userId, done: true, answers });
    try {
      await SecureStore.setItemAsync(keyOf(userId), JSON.stringify({ done: true, answers }));
    } catch {}
  },
}));