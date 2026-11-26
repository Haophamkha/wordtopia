import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { api, errorMessage } from '../../api/client';
import { GoalCelebration } from '../../components/ui/GoalCelebration';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { BellButton } from '../../components/ui/BellButton';
import { StatCard } from '../../components/ui/StatCard';
import { StreakCelebration } from '../../components/ui/StreakCelebration';
import { useOverview } from '../../hooks/useStats';
import { useAuthStore } from '../../store/auth';
import { colors, shadow } from '../../theme/colors';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useOverview();

  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const done = (data?.todayLearned ?? 0) + (data?.todayReviewed ?? 0);
  const goal = data?.dailyGoal ?? user?.dailyGoal ?? 10;
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const due = data?.dueToday ?? 0;

  // Hiệu ứng mất streak: hiện một lần rồi báo server đã xem.
  const [lostDismissed, setLostDismissed] = useState(false);
  const lostPrev = data?.streakLost?.previous ?? 0;
  const showLost = focused && lostPrev > 0 && !lostDismissed;

  function closeLost() {
    setLostDismissed(true);
    api.post('/study/streak-lost/ack').catch(() => {}).finally(() => refetch());
  }

  // Hiệu ứng đạt mục tiêu ngày: chỉ khi số từ vừa vượt mục tiêu.
  const [goalModal, setGoalModal] = useState(false);
  const prevDone = useRef<number | null>(null);
  useEffect(() => {
    if (!focused || !data) return;
    if (prevDone.current !== null && prevDone.current < goal && done >= goal) setGoalModal(true);
    prevDone.current = done;
  }, [focused, data, done, goal]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
      >
        <YStack gap={18}>
          <XStack justifyContent="space-between" alignItems="center">
            <YStack>
              <Text fontSize={14} color={colors.muted}>Xin chào 👋</Text>
              <Text fontSize={26} fontWeight="800" color={colors.text}>{user?.name}</Text>
            </YStack>
            <XStack gap={12} alignItems="center"><BellButton /><YStack width={46} height={46} borderRadius={23} backgroundColor={colors.primary} alignItems="center" justifyContent="center">
              <Text color="#fff" fontSize={20} fontWeight="800">{user?.name?.charAt(0).toUpperCase()}</Text>
            </YStack></XStack>
          </XStack>

          {error ? (
            <YStack backgroundColor="#FDECEC" borderRadius={14} padding={14} gap={10}>
              <Text color={colors.danger}>{errorMessage(error)}</Text>
              <PrimaryButton title="Thử lại" variant="outline" onPress={() => refetch()} />
            </YStack>
          ) : null}

          <LinearGradient colors={['#7B6CF0', '#5240D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 20, ...shadow }}>
            <XStack alignItems="center" gap={14}>
              <YStack width={56} height={56} borderRadius={18} backgroundColor="rgba(255,255,255,0.2)" alignItems="center" justifyContent="center">
                <Ionicons name="flame" size={32} color="#FFD27A" />
              </YStack>
              <YStack>
                <Text color="#fff" fontSize={13} opacity={0.85}>Chuỗi ngày học</Text>
                <Text color="#fff" fontSize={32} fontWeight="800">{isLoading ? '–' : data?.streak ?? 0} ngày</Text>
              </YStack>
            </XStack>
            <XStack justifyContent="space-between" marginTop={10}>
              <Text color="#fff" fontSize={13} opacity={0.85}>Kỷ lục: {data?.longestStreak ?? 0} ngày</Text>
              <Text color="#FFD27A" fontSize={13} fontWeight="800">
                ⭐ {data?.xp ?? 0} XP{data?.todayXp ? `  (+${data.todayXp} hôm nay)` : ''}
              </Text>
            </XStack>
            {data?.streakAtRisk ? (
              <Text color="#fff" fontSize={12} opacity={0.9} marginTop={8}>
                ⚠️ Học ít nhất 1 từ hôm nay để giữ chuỗi nhé!
              </Text>
            ) : null}
          </LinearGradient>

          <YStack backgroundColor={colors.card} borderRadius={20} padding={18} gap={10} style={shadow}>
            <XStack justifyContent="space-between">
              <Text fontWeight="700" color={colors.text}>Mục tiêu hôm nay</Text>
              <Text color={colors.muted}>{done}/{goal} từ</Text>
            </XStack>
            <YStack height={10} borderRadius={5} backgroundColor={colors.border} overflow="hidden">
              <YStack height={10} width={`${pct}%`} backgroundColor={colors.success} borderRadius={5} />
            </YStack>
            <Text fontSize={12} color={colors.muted}>
              {pct >= 100 ? 'Hoàn thành mục tiêu hôm nay! 🎉' : 'Cố lên, sắp đạt rồi!'}
            </Text>
          </YStack>

          <XStack gap={10}>
            <StatCard emoji="📖" value={data?.totalLearned ?? 0} label="Đã học" />
            <StatCard emoji="🏆" value={data?.mastered ?? 0} label="Đã thuộc" />
            <StatCard emoji="⏰" value={due} label="Cần ôn" />
          </XStack>

          {due > 0 ? (
            <PrimaryButton title={`Ôn ${due} từ đến hạn`} icon="refresh" onPress={() => router.push('/study' as never)} />
          ) : null}
          <PrimaryButton title="Chọn bộ từ để học" icon="library" variant={due > 0 ? 'outline' : 'primary'}
            onPress={() => router.push('/(tabs)/decks')} />
          <PrimaryButton title="Bảng xếp hạng" icon="trophy" variant="outline" onPress={() => router.push('/leaderboard' as never)} />
        </YStack>
      </ScrollView>

      <StreakCelebration visible={showLost} variant="lost" streak={lostPrev} onClose={closeLost} />
      <GoalCelebration visible={focused && goalModal && !showLost} goal={goal} onClose={() => setGoalModal(false)} />
    </Screen>
  );
}