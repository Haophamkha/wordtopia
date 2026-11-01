import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../api/client';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { useQuiz, useSubmitQuiz } from '../hooks/useQuiz';
import { colors } from '../theme/colors';
import type { QuizResult } from '../types/quiz';

export default function QuizScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const id = Number(deckId);
  const { data, isLoading, error, refetch } = useQuiz(id);
  const submit = useSubmitQuiz(id);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ wordId: number; selected: string }[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitErr, setSubmitErr] = useState('');
  const startedAt = useRef(Date.now());

  const questions = data?.questions ?? [];
  const total = questions.length;
  const q = questions[index];
  const isLast = index === total - 1;

  function doSubmit(list: { wordId: number; selected: string }[]) {
    setSubmitErr('');
    submit.mutate(
      { answers: list, durationSec: Math.round((Date.now() - startedAt.current) / 1000) },
      { onSuccess: setResult, onError: (e) => setSubmitErr(errorMessage(e)) },
    );
  }

  function next() {
    if (!q || selected === null) return;
    const list = [...answers, { wordId: q.wordId, selected }];
    setAnswers(list);
    setSelected(null);
    if (isLast) doSubmit(list);
    else setIndex(index + 1);
  }

  const header = (
    <XStack justifyContent="space-between" alignItems="center">
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text color={colors.primary} fontWeight="700" fontSize={16}>✕ Đóng</Text>
      </Pressable>
      {total > 0 && !result ? <Text color={colors.muted}>{index + 1}/{total}</Text> : null}
    </XStack>
  );

  if (result) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          {header}
          <YStack alignItems="center" gap={6} marginVertical={10}>
            <Text fontSize={56}>{result.score >= 80 ? '🏆' : result.score >= 50 ? '👍' : '💪'}</Text>
            <Text fontSize={36} fontWeight="800" color={colors.primary}>{result.score}%</Text>
            <Text color={colors.muted}>Đúng {result.correct}/{result.total} câu</Text>
          </YStack>
          {result.results.map((r) => (
            <YStack key={r.wordId} backgroundColor={colors.card} borderRadius={14} padding={14} gap={2}
              borderWidth={1} borderColor={r.isCorrect ? colors.success : colors.danger}>
              <Text fontWeight="700" color={colors.text}>{r.isCorrect ? '✅' : '❌'} {r.term}</Text>
              {!r.isCorrect ? <Text color={colors.danger} fontSize={13}>Bạn chọn: {r.selected}</Text> : null}
              <Text color={colors.muted} fontSize={13}>Đáp án: {r.correctMeaning}</Text>
            </YStack>
          ))}
          <PrimaryButton title="Xong" onPress={() => router.back()} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <YStack padding={20} gap={16} flex={1}>
        {header}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <YStack gap={10}>
            <Text color={colors.danger}>{errorMessage(error)}</Text>
            <PrimaryButton title="Thử lại" variant="outline" onPress={() => refetch()} />
          </YStack>
        ) : submit.isPending || submitErr ? (
          <YStack gap={10} alignItems="center" marginTop={40}>
            {submitErr ? (
              <>
                <Text color={colors.danger}>{submitErr}</Text>
                <PrimaryButton title="Gửi lại" onPress={() => doSubmit(answers)} />
              </>
            ) : (
              <>
                <ActivityIndicator color={colors.primary} />
                <Text color={colors.muted}>Đang chấm điểm...</Text>
              </>
            )}
          </YStack>
        ) : q ? (
          <>
            <YStack height={8} borderRadius={4} backgroundColor={colors.border} overflow="hidden">
              <YStack height={8} width={`${(index / total) * 100}%`} backgroundColor={colors.success} />
            </YStack>

            <YStack alignItems="center" gap={4} marginVertical={14}>
              <Text fontSize={13} color={colors.muted}>Chọn nghĩa đúng của từ</Text>
              <Text fontSize={34} fontWeight="800" color={colors.primary} textAlign="center">{q.term}</Text>
              {q.phonetic ? <Text color={colors.muted}>{q.phonetic}</Text> : null}
            </YStack>

            <YStack gap={10}>
              {q.options.map((o) => {
                const on = selected === o;
                return (
                  <Pressable key={o} onPress={() => setSelected(o)}>
                    <YStack padding={16} borderRadius={14} borderWidth={2}
                      borderColor={on ? colors.primary : colors.border}
                      backgroundColor={on ? colors.bg : colors.card}>
                      <Text fontSize={16} color={colors.text} fontWeight={on ? '700' : '500'}>{o}</Text>
                    </YStack>
                  </Pressable>
                );
              })}
            </YStack>

            <YStack marginTop="auto">
              <PrimaryButton title={isLast ? 'Nộp bài' : 'Câu tiếp'} onPress={next} disabled={selected === null} />
            </YStack>
          </>
        ) : null}
      </YStack>
    </Screen>
  );
}