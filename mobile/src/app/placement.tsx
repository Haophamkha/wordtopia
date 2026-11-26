import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../api/client';
import { pathApi } from '../api/path';
import { OptionButton } from '../components/exercises/ui';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { useAuthStore } from '../store/auth';
import { colors } from '../theme/colors';
import type { User } from '../types';

const LEVEL: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

function goPath() {
  router.replace('/(tabs)/path' as never);
}

export default function Placement() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['placement'],
    queryFn: pathApi.placement,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<{ wordId: number; selected: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [level, setLevel] = useState<string | null>(null);

  async function submit(all: { wordId: number; selected: string }[]) {
    setSubmitting(true);
    setSubmitError('');
    try {
      await pathApi.submitPlacement(all);
      const p = await pathApi.get();
      const { token, user, setSession } = useAuthStore.getState();
      if (token && user) await setSession(token, { ...user, onboarded: true, level: p.level } as User);
      qc.invalidateQueries({ queryKey: ['path'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setLevel(p.level);
    } catch (e) {
      setSubmitError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  function next(value: string) {
    if (!data) return;
    const all = [...answers, { wordId: data.questions[i].wordId, selected: value }];
    setAnswers(all);
    setSelected(null);
    if (i + 1 < data.questions.length) setI(i + 1);
    else submit(all);
  }

  if (isLoading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </Screen>
    );
  }

  if (error || !data) {
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

  if (level) {
    return (
      <Screen edges={['top', 'bottom']}>
        <YStack flex={1} padding={24} alignItems="center" justifyContent="center" gap={14}>
          <Text fontSize={64}>🎯</Text>
          <Text fontSize={16} color={colors.muted}>Trình độ của bạn</Text>
          <Text fontSize={34} fontWeight="800" color={colors.primary}>{LEVEL[level] ?? level}</Text>
          <Text color={colors.muted} textAlign="center">Lộ trình học đã được xếp phù hợp với bạn.</Text>
          <YStack width="100%" marginTop={12}>
            <PrimaryButton title="Bắt đầu học" onPress={goPath} />
          </YStack>
        </YStack>
      </Screen>
    );
  }

  const q = data.questions[i];
  const pct = Math.round((i / data.questions.length) * 100);

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack padding={20} paddingBottom={8} gap={14} alignItems="center">
        <Pressable onPress={() => (router.canGoBack() ? router.back() : goPath())}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
        <YStack flex={1} height={10} borderRadius={5} backgroundColor={colors.border} overflow="hidden">
          <YStack height={10} width={`${pct}%`} backgroundColor={colors.primary} borderRadius={5} />
        </YStack>
        <Text color={colors.muted} fontSize={12}>{i + 1}/{data.questions.length}</Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {submitting ? (
          <YStack alignItems="center" gap={10} marginTop={40}>
            <ActivityIndicator color={colors.primary} />
            <Text color={colors.muted}>Đang xếp trình độ...</Text>
          </YStack>
        ) : submitError ? (
          <YStack gap={10}>
            <Text color={colors.danger}>{submitError}</Text>
            <PrimaryButton title="Gửi lại" onPress={() => submit(answers)} />
          </YStack>
        ) : (
          <YStack gap={18}>
            <YStack alignItems="center" gap={6}>
              <Text color={colors.muted} fontSize={13}>Chọn nghĩa đúng của từ</Text>
              <Text fontSize={34} fontWeight="800" color={colors.text}>{q.term}</Text>
              {q.phonetic ? <Text color={colors.muted}>{q.phonetic}</Text> : null}
            </YStack>

            <YStack gap={10}>
              {q.options.map((o, k) => (
                <OptionButton key={`${k}-${o}`} label={o} state={selected === o ? 'selected' : 'idle'} onPress={() => setSelected(o)} />
              ))}
            </YStack>

            <PrimaryButton
              title={i + 1 === data.questions.length ? 'Hoàn thành' : 'Tiếp'}
              disabled={selected === null}
              onPress={() => next(selected ?? '')}
            />
            <PrimaryButton title="Không biết" variant="outline" onPress={() => next('')} />
          </YStack>
        )}
      </ScrollView>
    </Screen>
  );
}