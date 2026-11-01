import { router } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../../api/client';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { StatCard } from '../../components/ui/StatCard';
import { useOverview } from '../../hooks/useStats';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useOverview();

  const done = (data?.todayLearned ?? 0) + (data?.todayReviewed ?? 0);
  const goal = data?.dailyGoal ?? user?.dailyGoal ?? 10;
  const pct = Math.min(100, Math.round((done / goal) * 100));

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
      >
        <YStack gap={16}>
          <YStack>
            <Text fontSize={14} color={colors.muted}>Xin chào 👋</Text>
            <Text fontSize={26} fontWeight="800" color={colors.text}>{user?.name}</Text>
          </YStack>

          {error ? (
            <YStack backgroundColor="#FDECEC" borderRadius={14} padding={14} gap={10}>
              <Text color={colors.danger}>{errorMessage(error)}</Text>
              <PrimaryButton title="Thử lại" variant="outline" onPress={() => refetch()} />
            </YStack>
          ) : null}

          <YStack backgroundColor={colors.primary} borderRadius={20} padding={20} gap={4}>
            <Text color="#fff" fontSize={14} opacity={0.85}>Chuỗi ngày học</Text>
            <Text color="#fff" fontSize={36} fontWeight="800">🔥 {isLoading ? '–' : data?.streak ?? 0} ngày</Text>
            <Text color="#fff" fontSize={13} opacity={0.85}>Kỷ lục: {data?.longestStreak ?? 0} ngày</Text>
          </YStack>

          <YStack backgroundColor={colors.card} borderRadius={20} padding={18} gap={10} borderWidth={1} borderColor={colors.border}>
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
            <StatCard emoji="⏰" value={data?.dueToday ?? 0} label="Cần ôn" />
          </XStack>

          <PrimaryButton title="Bắt đầu học" onPress={() => router.push('/(tabs)/decks')} />
        </YStack>
      </ScrollView>
    </Screen>
  );
}