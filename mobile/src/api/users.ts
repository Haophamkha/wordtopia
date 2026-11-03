import { api } from './client';

export const usersApi = {
  update: (dto: { name?: string; dailyGoal?: number }) =>
    api.patch('/users/me', dto).then((r) => r.data),

  uploadAvatar: (uri: string) => {
    const form = new FormData();
    form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as unknown as Blob);
    return api
      .post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
      .then((r) => r.data as { avatar: string | null });
  },
};