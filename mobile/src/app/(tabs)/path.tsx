import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../../api/client';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { usePath } from '../../hooks/usePath';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';
import type { LessonSummary, UnitSummary } from '../../types/path';

const LEVEL: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

function openLesson(lesson: LessonSummary) {
  if (lesson.locked) {
    Alert.alert('Bài đang khóa', 'Hoàn thành bài trước để mở khóa bài này.');
    return;
  }
  router.push(`/lesson/${lesson.id}` as never);
}

function LessonNode({ lesson, isNext }: { lesson: LessonSummary; isNext: boolean }) {
  const bg = lesson.locked ? colors.border : lesson.completed ? colors.success : colors.primary;
  return (
    <Pressable onPress={() => openLesson(lesson)}>
      <YStack alignItems="center" gap={4} width={64}>
        <YStack
          width={56}
          height={56}
          borderRadius={28}
          backgroundColor={bg}
          alignItems="center"
          justifyContent="center"
          borderWidth={isNext ? 4 : 0}
          borderColor="#C9C2FF"
        >
          <Text fontSize={22} color="#fff" fontWeight="800">
            {lesson.locked ? '🔒' : lesson.completed ? '✓' : '▶'}
          </Text>
        </YStack>
        <Text fontSize={11} color={colors.muted}>
          {lesson.completed ? '⭐'.repeat(Math.max(lesson.stars, 1)) : `${lesson.wordCount} từ`}
        </Text>
      </YStack>
    </Pressable>
  );
}

function UnitCard({ unit, nextLessonId }: { unit: UnitSummary; nextLessonId: number | null }) {
  return (
    <YStack backgroundColor={colors.card} borderRadius={18} padding={16} gap={14} borderWidth={1} borderColor={colors.border}>
      <XStack alignItems="center" gap={12}>
        <Text fontSize={30}>{unit.emoji}</Text>
        <YStack flex={1}>
          <Text fontSize={16} fontWeight="800" color={colors.text}>{unit.titleVi}</Text>
          <Text fontSize={12} color={colors.muted}>
            {unit.title} · {unit.completedLessons}/{unit.totalLessons} bài
          </Text>
        </YStack>
      </XStack>
      <XStack flexWrap="wrap" gap={10}>
        {unit.lessons.map((l) => (
          <LessonNode key={l.id} lesson={l} isNext={l.id === nextLessonId} />
        ))}
      </XStack>
    </YStack>
  );
}

export default function PathScreen() {
  const user = useAuthStore((s) => s.user);
  const needPlacement = (user as { onboarded?: boolean } | null)?.onboarded === false;
  const { data, isLoading, error, refetch, isRefetching } = usePath();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const nextLesson = data?.units.flatMap((u) => u.lessons).find((l) => l.id === data.nextLessonId);
  const pct = data && data.totalLessons ? Math.round((data.completedLessons / data.totalLessons) * 100) : 0;

  return (
    <Screen>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : error || !data ? (
        <YStack padding={20} gap={10}>
          <Text color={colors.danger}>{errorMessage(error)}</Text>
          <PrimaryButton title="Thử lại" variant="outline" onPress={() => refetch()} />
        </YStack>
      ) : (
        <FlatList
          data={data.units}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
          ListHeaderComponent={
            <YStack gap={12} marginBottom={4}>
              <Text fontSize={26} fontWeight="800" color={colors.text}>Lộ trình học</Text>

              {needPlacement ? (
                <YStack backgroundColor="#FFF6E5" borderRadius={18} padding={16} gap={10} borderWidth={1} borderColor="#FFE0A3">
                  <Text fontSize={16} fontWeight="800" color={colors.text}>🎯 Kiểm tra trình độ</Text>
                  <Text color={colors.muted}>10 câu, khoảng 2 phút để xếp lộ trình phù hợp với bạn.</Text>
                  <PrimaryButton title="Làm bài test" onPress={() => router.push('/placement' as never)} />
                </YStack>
              ) : null}

              <YStack backgroundColor={colors.primary} borderRadius={20} padding={18} gap={8}>
                <Text color="#fff" opacity={0.85} fontSize={13}>Trình độ: {LEVEL[data.level] ?? data.level}</Text>
                <Text color="#fff" fontSize={22} fontWeight="800">
                  {data.completedLessons}/{data.totalLessons} bài hoàn thành
                </Text>
                <YStack height={8} borderRadius={4} backgroundColor="rgba(255,255,255,0.3)" overflow="hidden">
                  <YStack height={8} width={`${pct}%`} backgroundColor="#fff" borderRadius={4} />
                </YStack>
              </YStack>
              {nextLesson ? (
                <PrimaryButton title={`▶ Tiếp tục: ${nextLesson.title}`} onPress={() => openLesson(nextLesson)} />
              ) : null}
            </YStack>
          }
          renderItem={({ item }) => <UnitCard unit={item} nextLessonId={data.nextLessonId} />}
        />
      )}
    </Screen>
  );
}