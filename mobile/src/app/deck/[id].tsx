import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { ActivityIndicator, Alert, FlatList, Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../../api/client';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { useDeleteDeck, useDeleteWord } from '../../hooks/useManage';
import { useDeck, useToggleFavorite } from '../../hooks/useWords';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);
  const userId = useAuthStore((s) => s.user?.id);
  const { data, isLoading, error, refetch } = useDeck(deckId);
  const fav = useToggleFavorite(deckId);
  const delWord = useDeleteWord(deckId);
  const delDeck = useDeleteDeck();
  const mine = !!data && data.ownerId === userId;

  function confirmDeleteDeck() {
    Alert.alert('Xóa bộ từ?', 'Toàn bộ từ trong bộ sẽ bị xóa.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => delDeck.mutate(deckId, { onSuccess: () => router.back() }) },
    ]);
  }

  function confirmDeleteWord(wid: number, term: string) {
    Alert.alert('Xóa từ?', term, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => delWord.mutate(wid) },
    ]);
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <YStack padding={20} gap={14} flex={1}>
        <XStack justifyContent="space-between">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text color={colors.primary} fontWeight="700" fontSize={16}>‹ Quay lại</Text>
          </Pressable>
          {mine ? (
            <Pressable onPress={confirmDeleteDeck} hitSlop={12}>
              <Text color={colors.danger} fontWeight="700">🗑 Xóa bộ</Text>
            </Pressable>
          ) : null}
        </XStack>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : error || !data ? (
          <YStack gap={10}>
            <Text color={colors.danger}>{errorMessage(error)}</Text>
            <PrimaryButton title="Thử lại" variant="outline" onPress={() => refetch()} />
          </YStack>
        ) : (
          <>
            <XStack gap={12} alignItems="center">
              <Text fontSize={44}>{data.emoji || '📘'}</Text>
              <YStack flex={1}>
                <Text fontSize={22} fontWeight="800" color={colors.text}>{data.title}</Text>
                <Text fontSize={13} color={colors.muted}>{data.words.length} từ</Text>
              </YStack>
            </XStack>
            {data.description ? <Text color={colors.muted}>{data.description}</Text> : null}

            <XStack gap={10}>
              <YStack flex={1}>
                <PrimaryButton title="▶ Học" disabled={data.words.length === 0}
                  onPress={() => router.push({ pathname: '/study', params: { deckId: String(deckId) } } as never)} />
              </YStack>
              <YStack flex={1}>
                <PrimaryButton title="📝 Quiz" variant="outline" disabled={data.words.length === 0}
                  onPress={() => router.push({ pathname: '/quiz', params: { deckId: String(deckId) } } as never)} />
              </YStack>
            </XStack>

            {mine ? (
              <PrimaryButton title="＋ Thêm từ" variant="outline"
                onPress={() => router.push({ pathname: '/word-form', params: { deckId: String(deckId) } } as never)} />
            ) : null}

            <FlatList
              data={data.words}
              keyExtractor={(w) => String(w.id)}
              contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
              ListEmptyComponent={<Text color={colors.muted} textAlign="center">Bộ này chưa có từ nào</Text>}
              renderItem={({ item }) => (
                <XStack backgroundColor={colors.card} borderRadius={14} padding={14} gap={12} alignItems="center"
                  borderWidth={1} borderColor={colors.border}>
                  <YStack flex={1} gap={2}>
                    <Text fontSize={16} fontWeight="700" color={colors.text}>
                      {item.term} <Text fontSize={12} color={colors.muted}>{item.phonetic ?? ''}</Text>
                    </Text>
                    <Text fontSize={14} color={colors.muted}>{item.meaning}</Text>
                  </YStack>
                  <Pressable onPress={() => Speech.speak(item.term, { language: 'en-US' })} hitSlop={8}>
                    <Text fontSize={20}>🔊</Text>
                  </Pressable>
                  <Pressable onPress={() => fav.mutate(item.id)} hitSlop={8}>
                    <Text fontSize={22}>{item.isFavorite ? '⭐' : '☆'}</Text>
                  </Pressable>
                  {mine ? (
                    <>
                      <Pressable hitSlop={8} onPress={() => router.push({
                        pathname: '/word-form',
                        params: {
                          deckId: String(deckId), wordId: String(item.id), term: item.term, meaning: item.meaning,
                          phonetic: item.phonetic ?? '', example: item.example ?? '', exampleMeaning: item.exampleMeaning ?? '',
                        },
                      } as never)}>
                        <Text fontSize={18}>✏️</Text>
                      </Pressable>
                      <Pressable hitSlop={8} onPress={() => confirmDeleteWord(item.id, item.term)}>
                        <Text fontSize={18}>🗑</Text>
                      </Pressable>
                    </>
                  ) : null}
                </XStack>
              )}
            />
          </>
        )}
      </YStack>
    </Screen>
  );
}