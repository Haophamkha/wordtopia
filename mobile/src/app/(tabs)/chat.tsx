import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, TextInput } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { aiApi } from '../../api/ai';
import { errorMessage } from '../../api/client';
import { RichText } from '../../components/ui/RichText';
import { Screen } from '../../components/ui/Screen';
import { colors } from '../../theme/colors';

interface Msg { id: number; role: 'user' | 'ai'; text: string }

const GREETING: Msg = {
  id: 0,
  role: 'ai',
  text: 'Chào bạn! Mình là **Wordie**, gia sư tiếng Anh của bạn. Hỏi mình bất cứ điều gì nhé 😊',
};

const SUGGEST: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'swap-horizontal', text: 'Phân biệt make và do' },
  { icon: 'time-outline', text: 'Cách dùng thì hiện tại hoàn thành' },
  { icon: 'airplane-outline', text: 'Cho mình 5 từ vựng về du lịch' },
];

function AiBadge({ size = 30 }: { size?: number }) {
  return (
    <YStack width={size} height={size} borderRadius={size / 2} backgroundColor="#EFEBFF" alignItems="center" justifyContent="center">
      <Ionicons name="sparkles" size={size * 0.55} color={colors.primary} />
    </YStack>
  );
}

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<Msg>>(null);
  const nextId = useRef(1);
  const loaded = useRef(false);

  const hist = useQuery({
    queryKey: ['chat', 'history'],
    queryFn: aiApi.history,
    staleTime: Infinity,
    gcTime: 0,
  });

  useEffect(() => {
    if (!hist.data || loaded.current) return;
    loaded.current = true;
    const rows: Msg[] = hist.data.map((r) => ({
      id: nextId.current++,
      role: r.role === 'USER' ? 'user' : 'ai',
      text: r.content,
    }));
    setMsgs([GREETING, ...rows]);
  }, [hist.data]);

  function push(role: Msg['role'], text: string) {
    setMsgs((l) => [...l, { id: nextId.current++, role, text }]);
  }

  const chat = useMutation({
    mutationFn: (m: string) => aiApi.chat(m),
    onSuccess: (r) => push('ai', r.reply),
    onError: (e) => push('ai', '⚠️ ' + errorMessage(e)),
  });

  const clear = useMutation({
    mutationFn: aiApi.clear,
    onSuccess: () => setMsgs([GREETING]),
    onError: (e) => Alert.alert('Lỗi', errorMessage(e)),
  });

  function confirmClear() {
    Alert.alert('Xóa hội thoại?', 'Wordie sẽ quên toàn bộ cuộc trò chuyện.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => clear.mutate() },
    ]);
  }

  function send(text?: string) {
    const m = (text ?? input).trim();
    if (!m || chat.isPending) return;
    push('user', m);
    setInput('');
    chat.mutate(m);
  }

  const canSend = !!input.trim() && !chat.isPending;

  return (
    <Screen>
      <YStack flex={1}>
        <XStack paddingHorizontal={20} paddingTop={14} paddingBottom={12} alignItems="center" gap={12}
          borderBottomWidth={1} borderBottomColor={colors.border} backgroundColor="#fff">
          <AiBadge size={46} />
          <YStack flex={1}>
            <Text fontSize={22} fontWeight="800" color={colors.text}>Gia sư AI</Text>
            <XStack alignItems="center" gap={6}>
              <YStack width={8} height={8} borderRadius={4} backgroundColor={colors.success} />
              <Text fontSize={13} color={colors.muted}>Wordie · luôn sẵn sàng giải đáp</Text>
            </XStack>
          </YStack>
          <Pressable onPress={() => router.push('/lookup' as never)} hitSlop={8}>
            <XStack alignItems="center" gap={4} backgroundColor="#EFEBFF" paddingHorizontal={12} paddingVertical={8} borderRadius={16}>
              <Ionicons name="search" size={16} color={colors.primary} />
              <Text fontSize={13} fontWeight="700" color={colors.primary}>Tra từ</Text>
            </XStack>
          </Pressable>
          {msgs.length > 1 ? (
            <Pressable onPress={confirmClear} hitSlop={10}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </Pressable>
          ) : null}
        </XStack>

        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            chat.isPending ? (
              <XStack alignItems="flex-end" gap={8} marginTop={4}>
                <AiBadge />
                <XStack alignItems="center" gap={8} backgroundColor="#fff" borderWidth={1} borderColor={colors.border}
                  borderRadius={18} borderBottomLeftRadius={4} paddingHorizontal={14} paddingVertical={10}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text color={colors.muted}>Wordie đang soạn câu trả lời...</Text>
                </XStack>
              </XStack>
            ) : null
          }
          renderItem={({ item }) => {
            const mine = item.role === 'user';
            return (
              <XStack justifyContent={mine ? 'flex-end' : 'flex-start'} alignItems="flex-end" gap={8}>
                {!mine ? <AiBadge /> : null}
                <YStack
                  maxWidth="80%"
                  paddingHorizontal={14}
                  paddingVertical={10}
                  borderRadius={18}
                  borderBottomRightRadius={mine ? 4 : 18}
                  borderBottomLeftRadius={mine ? 18 : 4}
                  backgroundColor={mine ? colors.primary : '#fff'}
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
          <YStack gap={8} paddingHorizontal={16} paddingBottom={10}>
            <Text fontSize={12} fontWeight="700" color={colors.muted}>GỢI Ý CHO BẠN</Text>
            {SUGGEST.map((s) => (
              <Pressable key={s.text} onPress={() => send(s.text)}>
                <XStack alignItems="center" gap={10} paddingHorizontal={14} paddingVertical={12} borderRadius={16}
                  backgroundColor="#fff" borderWidth={1} borderColor={colors.border}>
                  <Ionicons name={s.icon} size={20} color={colors.primary} />
                  <Text flex={1} fontSize={14} color={colors.text}>{s.text}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </XStack>
              </Pressable>
            ))}
          </YStack>
        ) : null}

        <XStack paddingHorizontal={12} paddingVertical={10} gap={10} alignItems="flex-end"
          borderTopWidth={1} borderTopColor={colors.border} backgroundColor="#fff">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhập câu hỏi..."
            placeholderTextColor={colors.muted}
            multiline
            style={{
              flex: 1, maxHeight: 110, minHeight: 46, borderRadius: 23, paddingHorizontal: 18,
              paddingTop: 12, paddingBottom: 12, backgroundColor: colors.bg, color: colors.text, fontSize: 16,
            }}
          />
          <Pressable onPress={() => send()} disabled={!canSend}>
            <YStack width={46} height={46} borderRadius={23} alignItems="center" justifyContent="center"
              backgroundColor={canSend ? colors.primary : colors.muted}>
              <Ionicons name="arrow-up" size={22} color="#fff" />
            </YStack>
          </Pressable>
        </XStack>
      </YStack>
    </Screen>
  );
}