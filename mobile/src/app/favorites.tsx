import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { ActivityIndicator, FlatList, Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../api/client';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { useFavorites, useUnfavorite } from '../hooks/useQuiz';
import { colors } from '../theme/colors';

export default function Favorites() {
  const { data, isLoading, error, refetch } = useFavorites();
  const unfav = useUnfavorite();

  return (
    <Screen edges={['top', 'bottom']}>
      <YStack padding={20} gap={14} flex={1}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text color={colors.primary} fontWeight="700" fontSize={16}>‹ Quay lại</Text>
        </Pressable>
        <Text fontSize={26} fontWeight="800" color={colors.text}>⭐ Từ yêu thích</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : error ? (
          <YStack gap={10}>
            <Text color={colors.danger}>{errorMessage(error)}</Text>
            <PrimaryButton title="Thử lại" variant="outline" onPress={() => refetch()} />
          </YStack>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(w) => String(w.id)}
            contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
            ListEmptyComponent={<Text color={colors.muted} textAlign="center" marginTop={30}>Chưa có từ yêu thích</Text>}
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
                <Pressable onPress={() => unfav.mutate(item.id)} hitSlop={8}>
                  <Text fontSize={22}>⭐</Text>
                </Pressable>
              </XStack>
            )}
          />
        )}
      </YStack>
    </Screen>
  );
}