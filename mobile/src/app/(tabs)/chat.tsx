import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { aiApi } from '../../api/ai';
import { errorMessage } from '../../api/client';
import { RichText } from '../../components/ui/RichText';
import { Screen } from '../../components/ui/Screen';
import { colors } from '../../theme/colors';

interface Msg { id: number; role: 'user' | 'ai'; text: string }

const SUGGEST = ['Phân biệt make và do', 'Cách dùng thì hiện tại hoàn thành', 'Cho mình 5 từ về du lịch'];

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, role: 'ai', text: 'Chào bạn! Mình là **Wordie**, gia sư tiếng Anh của bạn. Hỏi mình bất cứ điều gì nhé 😊' },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<Msg>>(null);
  const nextId = useRef(1);

  const chat = useMutation({
    mutationFn: (m: string) => aiApi.chat(m),
    onSuccess: (r) => push('ai', r.reply),
    onError: (e) => push('ai', '⚠️ ' + errorMessage(e)),
  });

  function push(role: Msg['role'], text: string) {
    setMsgs((l) => [...l, { id: nextId.current++, role, text }]);
  }

  function send(text?: string) {
    const m = (text ?? input).trim();
    if (!m || chat.isPending) return;
    push('user', m);
    setInput('');
    chat.mutate(m);
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <YStack paddingHorizontal={20} paddingTop={14} paddingBottom={8}>
          <Text fontSize={24} fontWeight="800" color={colors.text}>🤖 Wordie</Text>
          <Text fontSize={13} color={colors.muted}>Gia sư tiếng Anh AI</Text>
        </YStack>

        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            chat.isPending ? <Text color={colors.muted} marginTop={4}>Wordie đang trả lời...</Text> : null
          }
          renderItem={({ item }) => {
            const mine = item.role === 'user';
            return (
              <XStack justifyContent={mine ? 'flex-end' : 'flex-start'}>
                <YStack
                  maxWidth="85%"
                  padding={12}
                  borderRadius={16}
                  backgroundColor={mine ? colors.primary : colors.card}
                  borderWidth={mine ? 0 : 1}
                  borderColor={colors.border}
                >
                  <RichText text={item.text} color={mine ? '#fff' : colors.text} />
                </YStack>
              </XStack>
            );
          }}
        />

        {msgs.length <= 1 ? (
          <XStack gap={8} flexWrap="wrap" paddingHorizontal={16} paddingBottom={8}>
            {SUGGEST.map((s) => (
              <Pressable key={s} onPress={() => send(s)}>
                <YStack paddingHorizontal={12} paddingVertical={8} borderRadius={16} backgroundColor={colors.card}
                  borderWidth={1} borderColor={colors.border}>
                  <Text fontSize={13} color={colors.primary}>{s}</Text>
                </YStack>
              </Pressable>
            ))}
          </XStack>
        ) : null}

        <XStack padding={12} gap={8} alignItems="center" borderTopWidth={1} borderTopColor={colors.border} backgroundColor="#fff">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhập câu hỏi..."
            placeholderTextColor={colors.muted}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            multiline
            style={{
              flex: 1, maxHeight: 100, minHeight: 44, borderRadius: 22, paddingHorizontal: 16,
              paddingTop: 12, paddingBottom: 12, backgroundColor: colors.bg, color: colors.text, fontSize: 16,
            }}
          />
          <Pressable onPress={() => send()} disabled={chat.isPending || !input.trim()}>
            <YStack width={44} height={44} borderRadius={22} alignItems="center" justifyContent="center"
              backgroundColor={chat.isPending || !input.trim() ? colors.muted : colors.primary}>
              <Text color="#fff" fontSize={18}>➤</Text>
            </YStack>
          </Pressable>
        </XStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}