import * as Haptics from 'expo-haptics';
import { aiApi } from '../../api/ai';
import { errorMessage } from '../../api/client';
import { playFeedback } from '../../lib/sfx';
import { comboLabel, nextFeedback } from '../../lib/praise';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';
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

export function FeedbackBar({ correct, answer, onNext, question, picked, explanation }: { correct: boolean; answer: string; onNext: () => void; question?: string; picked?: string; explanation?: string | null }) {
  const [fb] = useState(() => nextFeedback(correct));
  const [why, setWhy] = useState('');
  const [whyLoading, setWhyLoading] = useState(false);
  async function askWhy() {
    if (!question || whyLoading) return;
    setWhyLoading(true);
    try {
      const r = await aiApi.explainMistake({ question, answer, picked });
      setWhy(r.explanation);
    } catch (e) {
      setWhy(errorMessage(e));
    } finally {
      setWhyLoading(false);
    }
  }
  const pop = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    playFeedback(correct);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, []);
  const combo = correct ? comboLabel(fb.combo) : null;
  return (
    <YStack backgroundColor={correct ? '#E6F7EF' : '#FDECEC'} borderRadius={16} padding={14} gap={10}>
      <Animated.View style={{ transform: [{ scale: pop }], alignSelf: 'flex-start' }}>
        <Text fontWeight="800" fontSize={16} color={correct ? '#1B7F57' : colors.danger}>
          {correct ? `🎉 ${fb.text}` : '❌ Chưa đúng'}
        </Text>
      </Animated.View>
      {combo ? <Text fontWeight="700" fontSize={13} color="#E8590C">{combo}</Text> : null}
      {!correct ? <Text color={colors.text}>Đáp án: {answer}</Text> : null}
      {!correct && explanation ? <Text color={colors.muted}>{explanation}</Text> : null}
      {!correct && question && !why ? (
        <Pressable onPress={askWhy}>
          <Text color={colors.primary} fontWeight="700">{whyLoading ? 'Đang hỏi Wordie...' : '🤔 Vì sao sai?'}</Text>
        </Pressable>
      ) : null}
      {why ? <Text color={colors.text}>{why}</Text> : null}
      <PrimaryButton title="Tiếp tục" variant={correct ? 'primary' : 'danger'} onPress={onNext} />
    </YStack>
  );
}