import { Ionicons } from '@expo/vector-icons';
import { Text, YStack } from 'tamagui';
import { colors, shadow } from '../../theme/colors';

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, string]> = {
  '🔥': ['flame', '#FF7A45'],
  '🏅': ['ribbon', '#F5A623'],
  '🎯': ['flag', '#6C5CE7'],
  '📖': ['book', '#4C8DF6'],
  '🏆': ['trophy', '#F5A623'],
  '⏰': ['alarm', '#E5484D'],
  '📝': ['document-text', '#2EB67D'],
  '💯': ['stats-chart', '#6C5CE7'],
};

export function StatCard({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
  const ic = ICONS[emoji];
  return (
    <YStack flex={1} backgroundColor={colors.card} borderRadius={18} padding={14} alignItems="center" gap={6} style={shadow}>
      <YStack width={40} height={40} borderRadius={12} alignItems="center" justifyContent="center"
        backgroundColor={ic ? ic[1] + '1A' : colors.bg}>
        {ic ? <Ionicons name={ic[0]} size={22} color={ic[1]} /> : <Text fontSize={20}>{emoji}</Text>}
      </YStack>
      <Text fontSize={22} fontWeight="800" color={colors.text}>{value}</Text>
      <Text fontSize={12} color={colors.muted} textAlign="center">{label}</Text>
    </YStack>
  );
}