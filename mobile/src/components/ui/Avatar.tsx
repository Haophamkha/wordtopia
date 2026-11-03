import { Image } from 'expo-image';
import { Text, YStack } from 'tamagui';
import { colors } from '../../theme/colors';

export function Avatar({ uri, name, size = 88 }: { uri?: string | null; name?: string; size?: number }) {
  const initial = (name?.trim().charAt(0) || '?').toUpperCase();
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={size / 2}
      overflow="hidden"
      backgroundColor={colors.primary}
      alignItems="center"
      justifyContent="center"
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={200} />
      ) : (
        <Text color="#fff" fontSize={size * 0.42} fontWeight="800">{initial}</Text>
      )}
    </YStack>
  );
}