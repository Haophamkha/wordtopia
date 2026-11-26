import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { api, errorMessage } from '../api/client';
import { Avatar } from '../components/ui/Avatar';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { colors } from '../theme/colors';

type Period = 'week' | 'all';
type Scope = 'all' | 'friends';

interface Entry {
  rank: number;
  userId: number;
  name: string;
  avatar: string | null;
  streak: number;
  xp: number;
  isMe: boolean;
}

interface Board {
  period: Period;
  scope: Scope;
  weekStart: string | null;
  entries: Entry[];
  me: { rank: number | null; xp: number; hidden: boolean };
  total: number;
}

const MEDAL = ['🥇', '🥈', '🥉'];

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/home' as never);
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function Segment<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { key: T; label: string }[];
}) {
  return (
    <XStack gap={10}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={{
            flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 2,
            borderColor: value === o.key ? colors.primary : colors.border,
            backgroundColor: value === o.key ? '#EFEBFF' : '#fff',
          }}
        >
          <Text fontWeight="700" color={value === o.key ? colors.primary : colors.text}>{o.label}</Text>
        </Pressable>
      ))}
    </XStack>
  );
}

export default function Leaderboard() {
  const [scope, setScope] = useState<Scope>('all');
  const [period, setPeriod] = useState<Period>('week');
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard', scope, period],
    queryFn: () => api.get<Board>('/leaderboard', { params: { period, scope } }).then((r) => r.data),
  });

  const meInList = data?.entries.some((e) => e.isMe) ?? false;
  const onlyMe = scope === 'friends' && (data?.entries.length ?? 0) <= 1;

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack padding={20} paddingBottom={8} alignItems="center" justifyContent="space-between">
        <Text fontSize={24} fontWeight="800" color={colors.text}>🏆 Bảng xếp hạng</Text>
        <Pressable onPress={goBack} hitSlop={10}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
      </XStack>

      <YStack paddingHorizontal={20} gap={10} marginBottom={6}>
        <Segment<Scope> value={scope} onChange={setScope} options={[{ key: 'all', label: 'Mọi người' }, { key: 'friends', label: 'Bạn bè' }]} />
        <Segment<Period> value={period} onChange={setPeriod} options={[{ key: 'week', label: 'Tuần này' }, { key: 'all', label: 'Tất cả' }]} />
        <Text fontSize={12} color={colors.muted}>
          {period === 'week' && data?.weekStart
            ? `Tính XP từ thứ Hai ${fmtDate(data.weekStart)}, đặt lại mỗi tuần.`
            : 'Tổng XP từ trước đến nay.'}
        </Text>
      </YStack>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : error ? (
          <YStack gap={8}>
            <Text color={colors.danger}>{errorMessage(error)}</Text>
            <Pressable onPress={() => refetch()}><Text color={colors.primary} fontWeight="700">Thử lại</Text></Pressable>
          </YStack>
        ) : data && data.entries.length === 0 ? (
          <YStack alignItems="center" gap={8} marginTop={30}>
            <Text fontSize={44}>🌱</Text>
            <Text color={colors.muted} textAlign="center">
              Chưa có ai có XP {period === 'week' ? 'trong tuần này' : ''}. Học một bài để lên bảng đầu tiên nhé!
            </Text>
          </YStack>
        ) : (
          data?.entries.map((e) => (
            <XStack
              key={e.userId}
              alignItems="center"
              gap={12}
              padding={12}
              borderRadius={16}
              borderWidth={2}
              borderColor={e.isMe ? colors.primary : colors.border}
              backgroundColor={e.isMe ? '#EFEBFF' : colors.card}
            >
              <Text width={36} textAlign="center" fontSize={e.rank <= 3 ? 24 : 16} fontWeight="800" color={colors.muted}>
                {e.rank <= 3 ? MEDAL[e.rank - 1] : `#${e.rank}`}
              </Text>
              <Avatar uri={e.avatar} name={e.name} size={42} />
              <YStack flex={1}>
                <Text fontWeight="800" color={colors.text} numberOfLines={1}>
                  {e.name}{e.isMe ? ' (bạn)' : ''}
                </Text>
                {e.streak > 0 ? <Text fontSize={12} color={colors.muted}>🔥 {e.streak} ngày</Text> : null}
              </YStack>
              <Text fontWeight="800" color={colors.primary}>{e.xp} XP</Text>
            </XStack>
          ))
        )}

        {onlyMe && !isLoading && !error ? (
          <YStack backgroundColor={colors.card} borderRadius={16} padding={14} borderWidth={1} borderColor={colors.border} gap={10}>
            <Text color={colors.muted}>Bạn chưa có bạn bè nào trong bảng. Thêm bạn để cùng so tài!</Text>
            <PrimaryButton title="Thêm bạn" variant="outline" onPress={() => router.push('/friends' as never)} />
          </YStack>
        ) : null}

        {data && scope === 'all' && data.me.hidden ? (
          <Text color={colors.muted} fontSize={13}>
            Bạn đang ẩn khỏi bảng xếp hạng chung (đổi ở màn Bạn bè).
          </Text>
        ) : null}

        {data && !meInList && !isLoading && !data.me.hidden ? (
          <YStack backgroundColor={colors.card} borderRadius={16} padding={14} borderWidth={2} borderColor={colors.primary} gap={2}>
            <Text fontWeight="800" color={colors.text}>
              {data.me.rank ? `Hạng của bạn: #${data.me.rank}` : 'Bạn chưa có trong bảng'}
            </Text>
            <Text color={colors.muted} fontSize={13}>
              {data.me.rank
                ? `${data.me.xp} XP${period === 'week' ? ' tuần này' : ''}`
                : 'Hoàn thành một bài học để có XP và xuất hiện trên bảng.'}
            </Text>
          </YStack>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
