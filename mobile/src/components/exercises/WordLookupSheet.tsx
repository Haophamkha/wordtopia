import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { api, errorMessage } from '../../api/client';
import { colors } from '../../theme/colors';
import { SpeakButton } from './ui';

interface Explained {
  term: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  exampleMeaning?: string;
  similar?: { word: string; diffVi: string }[];
}

interface MyDeck {
  id: number;
  title: string;
  emoji?: string | null;
}

// Khung tra nghĩa dạng bottom sheet. Render kèm key={term} để mỗi từ có state riêng.
export function WordLookupSheet({ term, onClose }: { term: string; onClose: () => void }) {
  const qc = useQueryClient();
  const key = term.trim().toLowerCase();

  const q = useQuery({
    queryKey: ['explain', key],
    queryFn: () => api.post<Explained>('/ai/explain', { term: key }, { timeout: 60000 }).then((r) => r.data),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });
  const decks = useQuery({
    queryKey: ['decks', 'mine'],
    queryFn: () => api.get<MyDeck[]>('/decks/mine').then((r) => r.data),
  });

  const [added, setAdded] = useState<Record<number, boolean>>({});
  const [adding, setAdding] = useState<number | null>(null);
  const [saveError, setSaveError] = useState('');

  async function addTo(deck: MyDeck) {
    const r = q.data;
    if (!r || adding !== null || added[deck.id]) return;
    setAdding(deck.id);
    setSaveError('');
    try {
      await api.post(`/decks/${deck.id}/words`, {
        term: r.term,
        meaning: r.meaning,
        phonetic: r.phonetic,
        partOfSpeech: r.partOfSpeech,
        example: r.example,
        exampleMeaning: r.exampleMeaning,
      });
      setAdded((a) => ({ ...a, [deck.id]: true }));
      qc.invalidateQueries({ queryKey: ['decks'] });
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setAdding(null);
    }
  }

  const r = q.data;

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '78%',
            paddingTop: 16,
            paddingHorizontal: 20,
            paddingBottom: 28,
          }}
        >
          <XStack alignItems="center" justifyContent="space-between" marginBottom={10}>
            <YStack flex={1} gap={2}>
              <Text fontSize={26} fontWeight="800" color={colors.text}>{r?.term ?? term}</Text>
              {r ? <Text color={colors.muted}>{[r.phonetic, r.partOfSpeech].filter(Boolean).join(' · ')}</Text> : null}
            </YStack>
            <XStack alignItems="center" gap={12}>
              <SpeakButton text={r?.term ?? term} />
              <Pressable onPress={onClose} hitSlop={10}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
            </XStack>
          </XStack>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
            {q.isLoading ? (
              <XStack gap={10} alignItems="center">
                <ActivityIndicator color={colors.primary} />
                <Text color={colors.muted}>Đang tra nghĩa...</Text>
              </XStack>
            ) : q.error ? (
              <YStack gap={8}>
                <Text color={colors.danger}>{errorMessage(q.error)}</Text>
                <Pressable onPress={() => q.refetch()}><Text color={colors.primary} fontWeight="700">Thử lại</Text></Pressable>
              </YStack>
            ) : r ? (
              <>
                <Text fontSize={20} fontWeight="700" color={colors.primary}>{r.meaning}</Text>
                {r.example ? <Text color={colors.text}>{r.example}</Text> : null}
                {r.exampleMeaning ? <Text color={colors.muted}>{r.exampleMeaning}</Text> : null}

                {r.similar && r.similar.length > 0 ? (
                  <YStack backgroundColor={colors.card} borderRadius={14} padding={14} gap={8} borderWidth={1} borderColor={colors.border}>
                    <Text fontWeight="700" color={colors.text}>Phân biệt từ gần nghĩa</Text>
                    {r.similar.map((s) => (
                      <YStack key={s.word} gap={2}>
                        <Text fontWeight="700" color={colors.primary}>{s.word}</Text>
                        <Text color={colors.muted}>{s.diffVi}</Text>
                      </YStack>
                    ))}
                  </YStack>
                ) : null}

                <Text fontWeight="700" color={colors.text}>Lưu vào bộ từ</Text>
                {decks.isLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (decks.data ?? []).length === 0 ? (
                  <Text color={colors.muted}>Bạn chưa có bộ từ nào. Hãy tạo bộ từ ở tab Bộ từ, rồi quay lại lưu từ này.</Text>
                ) : (
                  (decks.data ?? []).map((d) => (
                    <Pressable key={d.id} onPress={() => addTo(d)} disabled={adding !== null || !!added[d.id]}>
                      <XStack
                        backgroundColor={colors.card} borderRadius={14} padding={14} gap={12} alignItems="center"
                        borderWidth={1} borderColor={added[d.id] ? colors.success : colors.border}
                        opacity={adding === d.id ? 0.5 : 1}
                      >
                        <Text fontSize={22}>{d.emoji || '📘'}</Text>
                        <Text flex={1} fontWeight="700" color={colors.text}>{d.title}</Text>
                        <Text color={added[d.id] ? '#1B7F57' : colors.primary} fontWeight="700">
                          {added[d.id] ? '✓ Đã thêm' : '＋ Thêm'}
                        </Text>
                      </XStack>
                    </Pressable>
                  ))
                )}
                {saveError ? <Text color={colors.danger}>{saveError}</Text> : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
