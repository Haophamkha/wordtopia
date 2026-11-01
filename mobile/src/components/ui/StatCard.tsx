import { Text, YStack } from 'tamagui';
import { colors } from '../../theme/colors';

export function StatCard({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
  return (
    <YStack flex={1} backgroundColor={colors.card} borderRadius={16} padding={14} alignItems="center" gap={4}
      borderWidth={1} borderColor={colors.border}>
      <Text fontSize={22}>{emoji}</Text>
      <Text fontSize={22} fontWeight="800" color={colors.text}>{value}</Text>
      <Text fontSize={12} color={colors.muted}>{label}</Text>
    </YStack>
  );
}