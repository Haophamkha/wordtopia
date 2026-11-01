import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { colors } from '../../theme/colors';

type Edge = 'top' | 'bottom' | 'left' | 'right';

export function Screen({ children, edges = ['top'] }: { children: ReactNode; edges?: Edge[] }) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>
      <YStack flex={1} width="100%" maxWidth={720} alignSelf="center">
        {children}
      </YStack>
    </SafeAreaView>
  );
}