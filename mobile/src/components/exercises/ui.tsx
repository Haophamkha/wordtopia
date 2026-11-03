import * as Haptics from 'expo-haptics';
import { playFeedback } from '../../lib/sfx';
import * as Speech from 'expo-speech';
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import { Text, YStack } from 'tamagui';
import { colors } from '../../theme/colors';
import { PrimaryButton } from '../ui/PrimaryButton';

export function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'en-US', rate: 0.9 });
}

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

const PALETTE: Record<OptionState, { bg: string; border: string; fg: string }> = {
  idle: { bg: '#fff', border: colors.border, fg: colors.text },
  selected: { bg: '#EFEBFF', border: colors.primary, fg: colors.primary },
  correct: { bg: '#E6F7EF', border: colors.success, fg: '#1B7F57' },
  wrong: { bg: '#FDECEC', border: colors.danger, fg: colors.danger },
  dim: { bg: '#fff', border: colors.border, fg: colors.muted },
};

export function OptionButton({ label, state = 'idle', onPress, disabled }: {
  label: string; state?: OptionState; onPress: () => void; disabled?: boolean;
}) {
  const p = PALETTE[state];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: p.bg,
        borderColor: p.border,
        borderWidth: 2,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        opacity: state === 'dim' ? 0.6 : 1,
      }}
    >
      <Text fontSize={16} fontWeight="600" color={p.fg}>{label}</Text>
    </Pressable>
  );
}

export function SpeakButton({ text }: { text: string }) {
  return (
    <Pressable
      onPress={() => speak(text)}
      style={{
        width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFEBFF',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text fontSize={26}>🔊</Text>
    </Pressable>
  );
}

export function FeedbackBar({ correct, answer, onNext }: { correct: boolean; answer: string; onNext: () => void }) {
  useEffect(() => {
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    playFeedback(correct);
  }, []);
  return (
    <YStack backgroundColor={correct ? '#E6F7EF' : '#FDECEC'} borderRadius={16} padding={14} gap={10}>
      <Text fontWeight="800" fontSize={16} color={correct ? '#1B7F57' : colors.danger}>
        {correct ? '🎉 Chính xác!' : '❌ Chưa đúng'}
      </Text>
      {!correct ? <Text color={colors.text}>Đáp án: {answer}</Text> : null}
      <PrimaryButton title="Tiếp tục" variant={correct ? 'primary' : 'danger'} onPress={onNext} />
    </YStack>
  );
}