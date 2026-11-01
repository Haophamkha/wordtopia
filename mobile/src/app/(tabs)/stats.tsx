import { RefreshControl, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../../api/client';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { StatCard } from '../../components/ui/StatCard';
import { useOverview, useWeekly } from '../../hooks/useStats';
import { colors } from '../../theme/colors';

const DAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const CHART_H = 120;

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <XStack gap={6} alignItems="center">
      <YStack width={10} height={10} borderRadius={5} backgroundColor={color} />
      <Text fontSize={12} color={colors.muted}>{label}</Text>
    </XStack>
  );
}

export default function Stats() {
  const ov = useOverview();
  const wk = useWeekly();

  const days = wk.data ?? [];
  const max = Math.max(1, ...days.map((d) => d.total));
  const weekTotal = days.reduce((s, d) => s + d.total, 0);
  const err = ov.error || wk.error;
  const refreshing = ov.isRefetching || wk.isRefetching;

  function refetchAll() {
    ov.refetch();
    wk.refetch();
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor={colors.primary} />}
      >
        <YStack gap={16}>
          <Text fontSize={26} fontWeight="800" color={colors.text}>Thống kê</Text>

          {err ? (
            <YStack backgroundColor="#FDECEC" borderRadius={14} padding={14} gap={10}>
              <Text color={colors.danger}>{errorMessage(err)}</Text>
              <PrimaryButton title="Thử lại" variant="outline" onPress={refetchAll} />
            </YStack>
          ) : null}

          <XStack gap={10}>
            <StatCard emoji="🔥" value={ov.data?.streak ?? 0} label="Chuỗi ngày" />
            <StatCard emoji="🏅" value={ov.data?.longestStreak ?? 0} label="Kỷ lục" />
            <StatCard emoji="🎯" value={ov.data?.dailyGoal ?? 0} label="Mục tiêu/ngày" />
          </XStack>

          <XStack gap={10}>
            <StatCard emoji="📖" value={ov.data?.totalLearned ?? 0} label="Đã học" />
            <StatCard emoji="🏆" value={ov.data?.mastered ?? 0} label="Đã thuộc" />
            <StatCard emoji="⏰" value={ov.data?.dueToday ?? 0} label="Cần ôn" />
          </XStack>

          <XStack gap={10}>
            <StatCard emoji="📝" value={ov.data?.quizCount ?? 0} label="Bài quiz" />
            <StatCard emoji="💯" value={`${ov.data?.avgScore ?? 0}%`} label="Điểm TB" />
          </XStack>

          <YStack backgroundColor={colors.card} borderRadius={20} padding={18} gap={14}
            borderWidth={1} borderColor={colors.border}>
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="700" color={colors.text}>7 ngày gần nhất</Text>
              <Text color={colors.muted} fontSize={13}>{weekTotal} lượt</Text>
            </XStack>

            <XStack height={CHART_H + 36} alignItems="flex-end" justifyContent="space-between">
              {days.map((d) => {
                const learnedH = (d.wordsLearned / max) * CHART_H;
                const reviewH = (d.wordsReview / max) * CHART_H;
                const dt = new Date(d.date + 'T00:00:00');
                return (
                  <YStack key={d.date} flex={1} alignItems="center" gap={4}>
                    <Text fontSize={11} color={colors.muted}>{d.total || ''}</Text>
                    <YStack width={22} justifyContent="flex-end" height={CHART_H}>
                      <YStack height={reviewH} backgroundColor={colors.success}
                        borderTopLeftRadius={6} borderTopRightRadius={6} />
                      <YStack height={learnedH} backgroundColor={colors.primary}
                        borderTopLeftRadius={reviewH ? 0 : 6} borderTopRightRadius={reviewH ? 0 : 6} />
                      {d.total === 0 ? <YStack height={3} backgroundColor={colors.border} borderRadius={2} /> : null}
                    </YStack>
                    <Text fontSize={12} color={colors.muted}>{DAY[dt.getDay()]}</Text>
                  </YStack>
                );
              })}
            </XStack>

            <XStack gap={16} justifyContent="center">
              <Legend color={colors.primary} label="Từ mới" />
              <Legend color={colors.success} label="Ôn tập" />
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  );
}