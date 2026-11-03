import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { colors, shadow } from '../../theme/colors';
import { Screen } from '../ui/Screen';

export function AuthShell({ emoji, title, subtitle, children, footer }: {
  emoji: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Screen edges={['top', 'bottom']}>
      <YStack flex={1} overflow="hidden">
        <YStack position="absolute" top={-70} right={-70} width={230} height={230} borderRadius={115} backgroundColor="#6C5CE726" />
        <YStack position="absolute" top={150} left={-100} width={190} height={190} borderRadius={95} backgroundColor="#4C8DF61F" />
        <YStack position="absolute" bottom={-80} right={-60} width={200} height={200} borderRadius={100} backgroundColor="#2EB67D1A" />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <YStack gap={24}>
            <YStack alignItems="center" gap={8}>
              <YStack width={92} height={92} borderRadius={28} backgroundColor="#fff" alignItems="center" justifyContent="center" style={shadow}>
                <Text fontSize={48}>{emoji}</Text>
              </YStack>
              <Text fontSize={32} fontWeight="800" color={colors.primary}>{title}</Text>
              <Text color={colors.muted} textAlign="center">{subtitle}</Text>
            </YStack>

            <YStack backgroundColor="#fff" borderRadius={28} padding={22} gap={16} style={shadow}>
              {children}
            </YStack>

            {footer}
          </YStack>
        </ScrollView>
      </YStack>
    </Screen>
  );
}

export function ErrorBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <XStack backgroundColor="#FDECEC" borderRadius={12} padding={12} gap={8} alignItems="center">
      <Ionicons name="alert-circle" size={20} color={colors.danger} />
      <Text flex={1} color={colors.danger} fontSize={14}>{text}</Text>
    </XStack>
  );
}

export function OrDivider() {
  return (
    <XStack alignItems="center" gap={12}>
      <YStack flex={1} height={1} backgroundColor={colors.border} />
      <Text color={colors.muted} fontSize={13}>hoặc</Text>
      <YStack flex={1} height={1} backgroundColor={colors.border} />
    </XStack>
  );
}

export function GoogleButton({ title, onPress, loading }: { title: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={loading} android_ripple={{ color: '#00000010' }}>
      <XStack
        height={52}
        borderRadius={16}
        borderWidth={1.5}
        borderColor={colors.border}
        backgroundColor="#fff"
        alignItems="center"
        justifyContent="center"
        gap={10}
        opacity={loading ? 0.6 : 1}
      >
        {loading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="logo-google" size={20} color="#EA4335" />}
        <Text fontSize={16} fontWeight="700" color={colors.text}>{title}</Text>
      </XStack>
    </Pressable>
  );
}