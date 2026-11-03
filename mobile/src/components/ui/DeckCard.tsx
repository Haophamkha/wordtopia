import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { colors, shadow } from '../../theme/colors';
import type { Deck } from '../../types/deck';

const LEVEL: Record<string, string> = { BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' };

export function DeckCard({ deck, onPress }: { deck: Deck; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <XStack backgroundColor={colors.card} borderRadius={18} padding={14} gap={14} alignItems="center" style={shadow}>
        <YStack width={54} height={54} borderRadius={16} backgroundColor={colors.primarySoft} alignItems="center" justifyContent="center">
          <Text fontSize={28}>{deck.emoji || '📘'}</Text>
        </YStack>
        <YStack flex={1} gap={3}>
          <Text fontSize={16} fontWeight="700" color={colors.text} numberOfLines={1}>{deck.title}</Text>
          <Text fontSize={12} color={colors.muted} numberOfLines={1}>
            {deck._count?.words ?? 0} từ · {LEVEL[deck.difficulty] ?? deck.difficulty}
            {deck.topic ? ` · ${deck.topic}` : ''}
          </Text>
        </YStack>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </XStack>
    </Pressable>
  );
}