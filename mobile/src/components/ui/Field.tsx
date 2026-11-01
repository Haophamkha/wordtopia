import type { ComponentProps } from 'react';
import { Input, Text, YStack } from 'tamagui';
import { colors } from '../../theme/colors';

type Props = ComponentProps<typeof Input> & { label: string };

export function Field({ label, ...rest }: Props) {
  return (
    <YStack gap={6}>
      <Text color={colors.muted} fontSize={13} fontWeight="600">
        {label}
      </Text>
      <Input
        backgroundColor="white"
        borderColor={colors.border}
        borderWidth={1}
        borderRadius={12}
        height={48}
        paddingHorizontal={14}
        fontSize={16}
        color={colors.text}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        {...rest}
      />
    </YStack>
  );
}