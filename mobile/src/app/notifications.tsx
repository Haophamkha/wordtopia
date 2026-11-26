import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../api/client';
import { notificationsApi, type AppNotification } from '../api/notifications';
import { Screen } from '../components/ui/Screen';
import { colors } from '../theme/colors';

const ICON: Record<string, string> = {
  STREAK_MILESTONE: '🔥',
  STREAK_LOST: '💔',
  DAILY_GOAL_DONE: '🎯',
  REVIEW_DUE: '⏰',
  SYSTEM: '📣',
};

function ago(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'Vừa xong';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: notificationsApi.list,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  const readOne = useMutation({ mutationFn: notificationsApi.read, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: notificationsApi.readAll, onSuccess: refresh });
  const hasUnread = (data ?? []).some((n) => !n.readAt);

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home' as never);
  }

  function renderItem({ item }: { item: AppNotification }) {
    const unread = !item.readAt;
    return (
      <Pressable onPress={() => unread && readOne.mutate(item.id)}>
        <XStack
          gap={12}
          padding={14}
          borderRadius={16}
          alignItems="center"
          backgroundColor={unread ? '#EFEBFF' : colors.card}
          borderWidth={1}
          borderColor={unread ? colors.primary : colors.border}
        >
          <Text fontSize={28}>{ICON[item.type] ?? '📣'}</Text>
          <YStack flex={1} gap={2}>
            <Text fontWeight={unread ? '800' : '600'} color={colors.text}>{item.title}</Text>
            <Text fontSize={13} color={colors.muted}>{item.body}</Text>
            <Text fontSize={11} color={colors.muted}>{ago(item.createdAt)}</Text>
          </YStack>
          {unread ? <YStack width={10} height={10} borderRadius={5} backgroundColor={colors.primary} /> : null}
        </XStack>
      </Pressable>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack padding={20} paddingBottom={8} alignItems="center" gap={14}>
        <Pressable onPress={back} hitSlop={10}><Text fontSize={26} color={colors.muted}>‹</Text></Pressable>
        <Text flex={1} fontSize={24} fontWeight="800" color={colors.text}>Thông báo</Text>
        {hasUnread ? (
          <Pressable onPress={() => readAll.mutate()}>
            <Text color={colors.primary} fontWeight="700">Đọc hết</Text>
          </Pressable>
        ) : null}
      </XStack>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text color={colors.danger} padding={20}>{errorMessage(error)}</Text>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 10 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
          ListEmptyComponent={
            <YStack alignItems="center" gap={8} marginTop={60}>
              <Text fontSize={48}>🔔</Text>
              <Text color={colors.muted}>Chưa có thông báo nào</Text>
            </YStack>
          }
        />
      )}
    </Screen>
  );
}