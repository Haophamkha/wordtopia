import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30000,
  });
}