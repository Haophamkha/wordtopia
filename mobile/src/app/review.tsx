import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { playFeedback } from '../lib/sfx';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { api, errorMessage } from '../api/client';
import { ReviewCard, type ReviewWord } from '../components/ReviewCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { colors } from '../theme/colors';

type SessionWord = ReviewWord & { isFavorite?: boolean; level?: number };

const fetchSession = (deckId?: number) =>
  api.get<SessionWord[]>('/study/session', { params: { deckId, limit: 20 } }).then((r) => r.data);

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/home' as never);
}

export default function Review() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const qc = useQueryClient();
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['review-session', deckId ?? 'all'],
    queryFn: () => fetchSession(deckId ? Number(deckId) : undefined),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [favs, setFavs] = useState<Record<number, boolean>>({});
  const pending = useRef<Promise<unknown>[]>([]);

  const total = data?.length ?? 0;
  const finished = total > 0 && i >= total;

  useEffect(() => {
    if (!finished) return;
    Promise.allSettled(pending.current).then(() => {
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['path'] });
    });
  }, [finished, qc]);

  function answer(correct: boolean) {
    if (!data) return;
    const w = data[i];
    Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    playFeedback(correct);
    pending.current.push(api.post('/study/review', { wordId: w.id, correct }).catch(() => {}));
    if (correct) setKnown((k) => k + 1);
    else setUnknown((k) => k + 1);
    setFlipped(false);
    setI(i + 1);
  }

  function toggleFav(w: SessionWord) {
    const now = !(favs[w.id] ?? w.isFavorite ?? false);
    setFavs((f) => ({ ...f, [w.id]: now }));
    api.post(`/words/${w.id}/favorite`).catch(() => setFavs((f) => ({ ...f, [w.id]: !now })));
  }

  function again() {
    setI(0);
    setKnown(0);
    setUnknown(0);
    setFlipped(false);
    pending.current = [];
    refetch();
  }

  if (isLoading || (isFetching && finished)) {
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
          <PrimaryButton title="Quay lại" variant="outline" onPress={goBack} />
        </YStack>
      </Screen>
    );
  }

  if (total === 0) {
    return (
      <Screen edges={['top', 'bottom']}>
        <YStack flex={1} padding={24} alignItems="center" justifyContent="center" gap={12}>
          <Text fontSize={60}>🎉</Text>
          <Text fontSize={22} fontWeight="800" color={colors.text}>Không còn từ cần ôn!</Text>
          <Text color={colors.muted} textAlign="center">Bạn đã ôn hết hôm nay. Hãy học thêm bài mới trong Lộ trình.</Text>
          <YStack width="100%" marginTop={10}>
            <PrimaryButton title="Quay lại" onPress={goBack} />
          </YStack>
        </YStack>
      </Screen>
    );
  }

  if (finished) {
    return (
      <Screen edges={['top', 'bottom']}>
        <YStack flex={1} padding={24} alignItems="center" justifyContent="center" gap={12}>
          <Text fontSize={60}>🏁</Text>
          <Text fontSize={24} fontWeight="800" color={colors.text}>Hoàn thành phiên ôn tập!</Text>
          <XStack gap={24} marginTop={6}>
            <YStack alignItems="center">
              <Text fontSize={30} fontWeight="800" color={colors.success}>{known}</Text>
              <Text color={colors.muted}>Đã nhớ</Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize={30} fontWeight="800" color={colors.danger}>{unknown}</Text>
              <Text color={colors.muted}>Chưa nhớ</Text>
            </YStack>
          </XStack>
          <YStack width="100%" gap={10} marginTop={14}>
            <PrimaryButton title="Ôn tiếp" onPress={again} />
            <PrimaryButton title="Xong" variant="outline" onPress={goBack} />
          </YStack>
        </YStack>
      </Screen>
    );
  }

  const w = data[i];
  const isFav = favs[w.id] ?? w.isFavorite ?? false;

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack padding={20} paddingBottom={8} gap={14} alignItems="center">
        <Pressable onPress={goBack}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
        <YStack flex={1} height={10} borderRadius={5} backgroundColor={colors.border} overflow="hidden">
          <YStack height={10} width={`${Math.round((i / total) * 100)}%`} backgroundColor={colors.primary} borderRadius={5} />
        </YStack>
        <Text color={colors.muted} fontSize={12}>{i + 1}/{total}</Text>
        <Pressable onPress={() => toggleFav(w)}><Text fontSize={22}>{isFav ? '⭐' : '☆'}</Text></Pressable>
      </XStack>

      <YStack flex={1} padding={20} gap={20} justifyContent="center">
        <ReviewCard key={w.id} word={w} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

        {flipped ? (
          <XStack gap={12}>
            <Pressable
              onPress={() => answer(false)}
              style={{ flex: 1, height: 54, borderRadius: 14, borderWidth: 2, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text color={colors.danger} fontWeight="800" fontSize={16}>😕 Chưa nhớ</Text>
            </Pressable>
            <Pressable
              onPress={() => answer(true)}
              style={{ flex: 1, height: 54, borderRadius: 14, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text color="#fff" fontWeight="800" fontSize={16}>😄 Đã nhớ</Text>
            </Pressable>
          </XStack>
        ) : (
          <PrimaryButton title="Lật thẻ" onPress={() => setFlipped(true)} />
        )}
      </YStack>
    </Screen>
  );
}