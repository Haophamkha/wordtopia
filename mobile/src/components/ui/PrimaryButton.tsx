import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';
import { colors } from '../../theme/colors';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
}

export function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary', icon }: Props) {
  const off = !!(disabled || loading);
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : '#fff';
  const fg = variant === 'outline' ? colors.primary : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderColor: variant === 'outline' ? colors.primary : bg,
        borderWidth: 1.5,
        opacity: off ? 0.55 : pressed ? 0.88 : 1,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...(variant !== 'outline' && !off
          ? { shadowColor: bg, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }
          : {}),
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <XStack gap={8} alignItems="center">
          {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
          <Text color={fg} fontSize={16} fontWeight="700">
            {title}
          </Text>
        </XStack>
      )}
    </Pressable>
  );
}