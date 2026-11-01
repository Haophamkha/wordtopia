import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, YStack } from 'tamagui';
import { errorMessage } from '../api/client';
import { Field } from '../components/ui/Field';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { useSaveWord } from '../hooks/useManage';
import { colors } from '../theme/colors';

export default function WordForm() {
  const p = useLocalSearchParams<{
    deckId: string; wordId?: string; term?: string; meaning?: string;
    phonetic?: string; example?: string; exampleMeaning?: string;
  }>();
  const deckId = Number(p.deckId);
  const wordId = p.wordId ? Number(p.wordId) : undefined;

  const [term, setTerm] = useState(p.term ?? '');
  const [meaning, setMeaning] = useState(p.meaning ?? '');
  const [phonetic, setPhonetic] = useState(p.phonetic ?? '');
  const [example, setExample] = useState(p.example ?? '');
  const [exampleMeaning, setExampleMeaning] = useState(p.exampleMeaning ?? '');
  const [error, setError] = useState('');
  const save = useSaveWord(deckId, wordId);

  function submit() {
    if (!term.trim() || !meaning.trim()) { setError('Nhập từ và nghĩa'); return; }
    setError('');
    save.mutate(
      {
        term: term.trim(),
        meaning: meaning.trim(),
        phonetic: phonetic.trim() || undefined,
        example: example.trim() || undefined,
        exampleMeaning: exampleMeaning.trim() || undefined,
      },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text color={colors.primary} fontWeight="700" fontSize={16}>‹ Quay lại</Text>
        </Pressable>
        <Text fontSize={26} fontWeight="800" color={colors.text}>{wordId ? 'Sửa từ' : 'Thêm từ'}</Text>

        <Field label="Từ tiếng Anh" value={term} onChangeText={setTerm} />
        <Field label="Nghĩa" value={meaning} onChangeText={setMeaning} autoCapitalize="sentences" />
        <Field label="Phiên âm" value={phonetic} onChangeText={setPhonetic} placeholder="/ˈded.laɪn/" />
        <Field label="Ví dụ" value={example} onChangeText={setExample} autoCapitalize="sentences" />
        <Field label="Nghĩa của ví dụ" value={exampleMeaning} onChangeText={setExampleMeaning} autoCapitalize="sentences" />

        {error ? <Text color={colors.danger}>{error}</Text> : null}
        <YStack>
          <PrimaryButton title="Lưu" onPress={submit} loading={save.isPending} />
        </YStack>
      </ScrollView>
    </Screen>
  );
}