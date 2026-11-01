import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../api/client';
import { FlipCard } from '../components/ui/FlipCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { useReview, useStudySession } from '../hooks/useWords';
import { colors } from '../theme/colors';

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const id = deckId ? Number(deckId) : undefined;
  const { data, isLoading, error, refetch } = useStudySession(id);
  const review = useReview();
  const qc = useQueryClient();

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [right, setRight] = useState(0);

  const total = data?.length ?? 0;
  const done = !!data && index >= total;
  const word = data?.[index];

  function answer(correct: boolean) {
    if (!word) return;
    review.mutate({ wordId: word.id, correct });
    if (correct) setRight((n) => n + 1);
    setFlipped(false);
    const next = index + 1;
    setIndex(next);
    if (next >= total) {
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['deck'] });
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <YStack padding={20} gap={16} flex={1}>
        <XStack justifyContent="space-between" alignItems="center">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text color={colors.primary} fontWeight="700" fontSize={16}>✕ Đóng</Text>
          </Pressable>
          {total > 0 && !done ? <Text color={colors.muted}>{index + 1}/{total}</Text> : null}
        </XStack>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <YStack gap={10}>
            <Text color={colors.danger}>{errorMessage(error)}</Text>
            <PrimaryButton title="Thử lại" variant="outline" onPress={() => refetch()} />
          </YStack>
        ) : total === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap={10}>
            <Text fontSize={56}>🎉</Text>
            <Text fontSize={20} fontWeight="800" color={colors.text}>Không còn từ cần học</Text>
            <PrimaryButton title="Quay lại" onPress={() => router.back()} />
          </YStack>
        ) : done ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap={10}>
            <Text fontSize={56}>🏆</Text>
            <Text fontSize={22} fontWeight="800" color={colors.text}>Hoàn thành!</Text>
            <Text color={colors.muted}>Đúng {right}/{total} từ</Text>
            <YStack width="100%" marginTop={10}>
              <PrimaryButton title="Xong" onPress={() => router.back()} />
            </YStack>
          </YStack>
        ) : word ? (
          <>
            <YStack height={8} borderRadius={4} backgroundColor={colors.border} overflow="hidden">
              <YStack height={8} width={`${(index / total) * 100}%`} backgroundColor={colors.success} />
            </YStack>

            <YStack marginTop={10}>
              <FlipCard word={word} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
            </YStack>

            <YStack marginTop="auto" gap={10}>
              {flipped ? (
                <XStack gap={10}>
                  <YStack flex={1}>
                    <PrimaryButton title="Chưa thuộc" variant="danger" onPress={() => answer(false)} />
                  </YStack>
                  <YStack flex={1}>
                    <PrimaryButton title="Đã thuộc" onPress={() => answer(true)} />
                  </YStack>
                </XStack>
              ) : (
                <PrimaryButton title="Lật thẻ" variant="outline" onPress={() => setFlipped(true)} />
              )}
            </YStack>
          </>
        ) : null}
      </YStack>
    </Screen>
  );
}