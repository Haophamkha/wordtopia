import { api } from './client';

export const usersApi = {
  update: (dto: { name?: string; dailyGoal?: number }) =>
    api.patch('/users/me', dto).then((r) => r.data),
};