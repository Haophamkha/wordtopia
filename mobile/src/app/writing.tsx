import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { aiApi } from '../api/ai';
import { errorMessage } from '../api/client';
import { SpeakButton } from '../components/exercises/ui';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { colors } from '../theme/colors';

const MAX = 600;

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/chat' as never);
}

export default function Writing() {
  const [text, setText] = useState('');
  const check = useMutation({ mutationFn: (t: string) => aiApi.correctWriting(t) });
  const r = check.data;
  const scoreColor = r?.score == null ? colors.muted : r.score >= 8 ? '#1B7F57' : r.score >= 5 ? '#B7791F' : colors.danger;

  function submit() {
    const t = text.trim();
    if (t && !check.isPending) check.mutate(t);
  }

  function reset() {
    check.reset();
    setText('');
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack padding={20} paddingBottom={8} alignItems="center" justifyContent="space-between">
        <Text fontSize={24} fontWeight="800" color={colors.text}>✍️ Sửa câu viết</Text>
        <Pressable onPress={goBack} hitSlop={10}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Text color={colors.muted}>
          Viết một câu hoặc đoạn ngắn bằng tiếng Anh, AI sẽ sửa lỗi và giải thích bằng tiếng Việt.
        </Text>

        <YStack gap={6}>
          <TextInput
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX))}
            placeholder="VD: I goes to school yesterday."
            placeholderTextColor={colors.muted}
            multiline
            editable={!check.isPending}
            style={{
              minHeight: 110, maxHeight: 220, borderRadius: 16, padding: 14, fontSize: 16, textAlignVertical: 'top',
              backgroundColor: '#fff', color: colors.text, borderWidth: 2, borderColor: colors.border,
            }}
          />
          <Text fontSize={12} color={colors.muted} textAlign="right">{text.length}/{MAX}</Text>
        </YStack>

        <PrimaryButton title="Chấm bài" onPress={submit} loading={check.isPending} disabled={!text.trim()} />

        {check.error ? <Text color={colors.danger}>{errorMessage(check.error)}</Text> : null}

        {r ? (
          <YStack gap={14}>
            <XStack alignItems="center" gap={12}>
              {r.score != null ? (
                <YStack width={64} height={64} borderRadius={32} borderWidth={3} borderColor={scoreColor} alignItems="center" justifyContent="center">
                  <Text fontSize={22} fontWeight="800" color={scoreColor}>{r.score}/10</Text>
                </YStack>
              ) : null}
              <Text flex={1} color={colors.text}>{r.summaryVi || (r.mistakes.length === 0 ? 'Câu của bạn ổn rồi!' : 'Cùng xem các lỗi nhé.')}</Text>
            </XStack>

            <YStack backgroundColor={colors.card} borderRadius={18} padding={16} gap={8} borderWidth={1} borderColor={colors.border}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="800" color={colors.text}>Câu đã sửa</Text>
                <SpeakButton text={r.corrected} />
              </XStack>
              <Text fontSize={17} color={colors.primary} fontWeight="700">{r.corrected}</Text>
            </YStack>

            {r.mistakes.length > 0 ? (
              <YStack gap={8}>
                <Text fontWeight="800" color={colors.text}>Các lỗi ({r.mistakes.length})</Text>
                {r.mistakes.map((m, i) => (
                  <YStack key={i} backgroundColor={colors.card} borderRadius={16} padding={14} gap={4} borderWidth={1} borderColor={colors.border}>
                    <XStack gap={8} flexWrap="wrap" alignItems="center">
                      <Text color={colors.danger} textDecorationLine="line-through">{m.original}</Text>
                      <Text color={colors.muted}>→</Text>
                      <Text color="#1B7F57" fontWeight="800">{m.fix}</Text>
                    </XStack>
                    <Text color={colors.muted}>{m.explanationVi}</Text>
                  </YStack>
                ))}
              </YStack>
            ) : null}

            {r.better ? (
              <YStack backgroundColor="#EFEBFF" borderRadius={18} padding={16} gap={6}>
                <Text fontWeight="800" color={colors.text}>Gợi ý viết hay hơn</Text>
                <Text fontSize={16} color={colors.text}>{r.better}</Text>
              </YStack>
            ) : null}

            <PrimaryButton title="Viết câu khác" variant="outline" onPress={reset} />
          </YStack>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
