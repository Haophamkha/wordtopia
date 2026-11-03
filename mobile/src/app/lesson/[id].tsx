import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../../api/client';
import { pathApi } from '../../api/path';
import { ExerciseView, type Result } from '../../components/exercises/ExerciseView';
import { SpeakButton } from '../../components/exercises/ui';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { colors } from '../../theme/colors';
import type { CompleteResult } from '../../types/lesson';

function goPath() {
  router.replace('/(tabs)/path' as never);
}

function LessonPlayer({ lessonId }: { lessonId: number }) {
  const qc = useQueryClient();
  const { data: lesson, isLoading, error, refetch } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => pathApi.lesson(lessonId),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const [intro, setIntro] = useState(true);
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<CompleteResult | null>(null);
  const startedAt = useRef(Date.now());

  function confirmExit() {
    Alert.alert('Thoát bài học?', 'Tiến độ bài này sẽ không được lưu.', [
      { text: 'Tiếp tục học', style: 'cancel' },
      { text: 'Thoát', style: 'destructive', onPress: () => (router.canGoBack() ? router.back() : goPath()) },
    ]);
  }

  async function finish(merged: Record<number, boolean>) {
    if (!lesson) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const answers = lesson.words.map((w) => ({ wordId: w.id, correct: merged[w.id] ?? true }));
      const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
      const res = await pathApi.complete(lesson.id, answers, durationSec);
      setResult(res ?? {});
      qc.invalidateQueries({ queryKey: ['path'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    } catch (e) {
      setSubmitError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  function onDone(results: Result[]) {
    if (!lesson) return;
    const merged = { ...outcome };
    for (const r of results) merged[r.wordId] = (merged[r.wordId] ?? true) && r.correct;
    setOutcome(merged);
    if (step + 1 < lesson.exercises.length) setStep(step + 1);
    else finish(merged);
  }

  if (isLoading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </Screen>
    );
  }

  if (error || !lesson) {
    return (
      <Screen edges={['top', 'bottom']}>
        <YStack padding={20} gap={10}>
          <Text color={colors.danger}>{errorMessage(error)}</Text>
          <PrimaryButton title="Thử lại" variant="outline" onPress={() => refetch()} />
          <PrimaryButton title="Quay lại" variant="outline" onPress={goPath} />
        </YStack>
      </Screen>
    );
  }

  // ----- Kết quả -----
  if (result) {
    const wrong = lesson.words.filter((w) => outcome[w.id] === false).length;
    const stars = result.stars ?? (wrong === 0 ? 3 : wrong <= 1 ? 2 : 1);
    return (
      <Screen edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <YStack alignItems="center" gap={8} marginTop={20}>
            <Text fontSize={64}>{wrong === 0 ? '🎉' : '👏'}</Text>
            <Text fontSize={26} fontWeight="800" color={colors.text}>Hoàn thành bài học!</Text>
            <Text fontSize={36}>{'⭐'.repeat(Math.max(0, Math.min(stars, 3)))}</Text>
            <Text color={colors.muted}>
              Đúng {lesson.words.length - wrong}/{lesson.words.length} từ
            </Text>
          </YStack>

          <YStack backgroundColor={colors.card} borderRadius={16} padding={14} gap={10} borderWidth={1} borderColor={colors.border}>
            {lesson.words.map((w) => (
              <XStack key={w.id} justifyContent="space-between" alignItems="center">
                <Text fontWeight="700" color={colors.text}>{outcome[w.id] === false ? '❌' : '✅'} {w.term}</Text>
                <Text color={colors.muted}>{w.meaning}</Text>
              </XStack>
            ))}
          </YStack>

          {result.nextLessonId ? (
            <PrimaryButton title="Bài tiếp theo ▶" onPress={() => router.replace(`/lesson/${result.nextLessonId}` as never)} />
          ) : null}
          <PrimaryButton title="Về lộ trình" variant="outline" onPress={goPath} />
        </ScrollView>
      </Screen>
    );
  }

  // ----- Giới thiệu từ mới -----
  if (intro) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <XStack justifyContent="space-between" alignItems="center">
            <YStack flex={1}>
              <Text fontSize={13} color={colors.muted}>{lesson.unit.emoji} {lesson.unit.titleVi}</Text>
              <Text fontSize={24} fontWeight="800" color={colors.text}>{lesson.title}</Text>
            </YStack>
            <Pressable onPress={goPath}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
          </XStack>
          <Text color={colors.muted}>Làm quen {lesson.words.length} từ mới trước khi làm bài tập</Text>

          {lesson.words.map((w) => (
            <XStack key={w.id} backgroundColor={colors.card} borderRadius={16} padding={14} gap={12} alignItems="center"
              borderWidth={1} borderColor={colors.border}>
              <YStack flex={1} gap={2}>
                <Text fontSize={20} fontWeight="800" color={colors.text}>{w.term}</Text>
                <Text fontSize={13} color={colors.muted}>{w.phonetic}</Text>
                <Text fontSize={16} fontWeight="600" color={colors.primary}>{w.meaning}</Text>
                {w.example ? <Text fontSize={13} color={colors.muted} marginTop={4}>{w.example}</Text> : null}
                {w.exampleMeaning ? <Text fontSize={12} color={colors.muted}>{w.exampleMeaning}</Text> : null}
              </YStack>
              <SpeakButton text={w.term} />
            </XStack>
          ))}

          <PrimaryButton
            title="Bắt đầu làm bài"
            onPress={() => {
              startedAt.current = Date.now();
              setIntro(false);
            }}
          />
        </ScrollView>
      </Screen>
    );
  }

  // ----- Làm bài -----
  const total = lesson.exercises.length;
  const pct = Math.round((step / total) * 100);
  const exercise = lesson.exercises[step];

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <XStack padding={20} paddingBottom={8} gap={14} alignItems="center">
          <Pressable onPress={confirmExit}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
          <YStack flex={1} height={10} borderRadius={5} backgroundColor={colors.border} overflow="hidden">
            <YStack height={10} width={`${pct}%`} backgroundColor={colors.success} borderRadius={5} />
          </YStack>
          <Text color={colors.muted} fontSize={12}>{step + 1}/{total}</Text>
        </XStack>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {submitting ? (
            <YStack alignItems="center" gap={10} marginTop={40}>
              <ActivityIndicator color={colors.primary} />
              <Text color={colors.muted}>Đang lưu kết quả...</Text>
            </YStack>
          ) : submitError ? (
            <YStack gap={10}>
              <Text color={colors.danger}>{submitError}</Text>
              <PrimaryButton title="Gửi lại kết quả" onPress={() => finish(outcome)} />
            </YStack>
          ) : (
            <ExerciseView key={exercise.id} exercise={exercise} onDone={onDone} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export default function LessonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LessonPlayer key={id} lessonId={Number(id)} />;
}