import { api } from './client';

export const surveyApi = {
  setDailyGoal: (dailyGoal: number) => api.patch('/users/me', { dailyGoal }).then((r) => r.data),
};