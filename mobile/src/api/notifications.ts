import { api } from './client';

export type NotificationType = 'STREAK_MILESTONE' | 'STREAK_LOST' | 'DAILY_GOAL_DONE' | 'REVIEW_DUE' | 'SYSTEM';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  list: () => api.get<AppNotification[]>('/notifications').then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  read: (id: number) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  readAll: () => api.patch('/notifications/read-all').then((r) => r.data),
};