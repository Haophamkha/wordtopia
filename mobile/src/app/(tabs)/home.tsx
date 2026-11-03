import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../../api/client';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { StatCard } from '../../components/ui/StatCard';
import { useOverview } from '../../hooks/useStats';
import { useAuthStore } from '../../store/auth';
import { colors, shadow } from '../../theme/colors';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useOverview();

  const done = (data?.todayLearned ?? 0) + (data?.todayReviewed ?? 0);
  const goal = data?.dailyGoal ?? user?.dailyGoal ?? 10;
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const due = data?.dueToday ?? 0;

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
            <YStack width={46} height={46} borderRadius={23} backgroundColor={colors.primary} alignItems="center" justifyContent="center">
              <Text color="#fff" fontSize={20} fontWeight="800">{user?.name?.charAt(0).toUpperCase()}</Text>
            </YStack>
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
            <Text color="#fff" fontSize={13} opacity={0.85} marginTop={10}>Kỷ lục: {data?.longestStreak ?? 0} ngày</Text>
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
        </YStack>
      </ScrollView>
    </Screen>
  );
}