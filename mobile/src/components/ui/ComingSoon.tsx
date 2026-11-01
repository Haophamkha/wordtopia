import { Text, YStack } from 'tamagui';
import { colors } from '../../theme/colors';
import { Screen } from './Screen';

export function ComingSoon({ emoji, title }: { emoji: string; title: string }) {
  return (
    <Screen>
      <YStack flex={1} alignItems="center" justifyContent="center" gap={8}>
        <Text fontSize={56}>{emoji}</Text>
        <Text fontSize={22} fontWeight="800" color={colors.text}>{title}</Text>
        <Text color={colors.muted}>Đang được xây dựng...</Text>
      </YStack>
    </Screen>
  );
}