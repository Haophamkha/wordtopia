import { Alert } from '../components/ui/AppDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { api, errorMessage } from '../api/client';
import { SpeakButton } from '../components/exercises/ui';
import { Field } from '../components/ui/Field';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { colors } from '../theme/colors';

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

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/chat' as never);
}

export default function Lookup() {
  const qc = useQueryClient();
  const [term, setTerm] = useState('');
  const [result, setResult] = useState<Explained | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingTo, setAddingTo] = useState<number | null>(null);

  const decks = useQuery({
    queryKey: ['decks', 'mine'],
    queryFn: () => api.get<MyDeck[]>('/decks/mine').then((r) => r.data),
  });

  async function search() {
    if (!term.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post<Explained>('/ai/explain', { term: term.trim() }, { timeout: 60000 });
      setResult(res.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function addTo(deck: MyDeck) {
    if (!result) return;
    setAddingTo(deck.id);
    try {
      await api.post(`/decks/${deck.id}/words`, {
        term: result.term,
        meaning: result.meaning,
        phonetic: result.phonetic,
        partOfSpeech: result.partOfSpeech,
        example: result.example,
        exampleMeaning: result.exampleMeaning,
      });
      qc.invalidateQueries({ queryKey: ['decks'] });
      Alert.alert('Đã thêm', `"${result.term}" đã được thêm vào "${deck.title}".`);
    } catch (e) {
      Alert.alert('Không thêm được', errorMessage(e));
    } finally {
      setAddingTo(null);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack padding={20} paddingBottom={8} alignItems="center" justifyContent="space-between">
        <Text fontSize={24} fontWeight="800" color={colors.text}>🔍 Tra từ nhanh</Text>
        <Pressable onPress={goBack}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Field label="Từ hoặc cụm từ tiếng Anh" value={term} onChangeText={setTerm} placeholder="VD: deadline" onSubmitEditing={search} />
        <PrimaryButton title="Tra bằng AI" onPress={search} loading={loading} disabled={!term.trim()} />

        {error ? <Text color={colors.danger}>{error}</Text> : null}

        {result ? (
          <YStack gap={14}>
            <YStack backgroundColor={colors.card} borderRadius={18} padding={18} gap={8} borderWidth={1} borderColor={colors.border}>
              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1} gap={2}>
                  <Text fontSize={28} fontWeight="800" color={colors.text}>{result.term}</Text>
                  <Text color={colors.muted}>{result.phonetic} · {result.partOfSpeech}</Text>
                </YStack>
                <SpeakButton text={result.term} />
              </XStack>
              <Text fontSize={20} fontWeight="700" color={colors.primary}>{result.meaning}</Text>
              {result.example ? <Text color={colors.text}>{result.example}</Text> : null}
              {result.exampleMeaning ? <Text color={colors.muted}>{result.exampleMeaning}</Text> : null}
            </YStack>

            {result.similar && result.similar.length > 0 ? (
              <YStack backgroundColor={colors.card} borderRadius={18} padding={18} gap={10} borderWidth={1} borderColor={colors.border}>
                <Text fontWeight="700" color={colors.text}>Phân biệt từ gần nghĩa</Text>
                {result.similar.map((s) => (
                  <YStack key={s.word} gap={2}>
                    <Text fontWeight="700" color={colors.primary}>{s.word}</Text>
                    <Text color={colors.muted}>{s.diffVi}</Text>
                  </YStack>
                ))}
              </YStack>
            ) : null}

            <Text fontWeight="700" color={colors.text}>Thêm vào bộ từ của bạn</Text>
            {decks.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (decks.data ?? []).length === 0 ? (
              <YStack gap={10}>
                <Text color={colors.muted}>Bạn chưa có bộ từ nào.</Text>
                <PrimaryButton title="Tạo bộ từ mới" variant="outline" onPress={() => router.push('/deck/new' as never)} />
              </YStack>
            ) : (
              (decks.data ?? []).map((d) => (
                <Pressable key={d.id} onPress={() => addTo(d)} disabled={addingTo !== null}>
                  <XStack backgroundColor={colors.card} borderRadius={14} padding={14} gap={12} alignItems="center"
                    borderWidth={1} borderColor={colors.border} opacity={addingTo === d.id ? 0.5 : 1}>
                    <Text fontSize={24}>{d.emoji || '📘'}</Text>
                    <Text flex={1} fontWeight="700" color={colors.text}>{d.title}</Text>
                    <Text color={colors.primary} fontWeight="700">＋ Thêm</Text>
                  </XStack>
                </Pressable>
              ))
            )}
          </YStack>
        ) : null}
      </ScrollView>
    </Screen>
  );
}