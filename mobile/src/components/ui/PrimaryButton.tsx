import { ActivityIndicator, Pressable } from 'react-native';
import { Text } from 'tamagui';
import { colors } from '../../theme/colors';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
}

export function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary' }: Props) {
  const off = !!(disabled || loading);
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent';
  const fg = variant === 'outline' ? colors.primary : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderColor: variant === 'outline' ? colors.primary : bg,
        borderWidth: 1.5,
        opacity: off ? 0.6 : pressed ? 0.85 : 1,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text color={fg} fontSize={16} fontWeight="700">
          {title}
        </Text>
      )}
    </Pressable>
  );
}