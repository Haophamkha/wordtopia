import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../../api/client';
import { Field } from '../../components/ui/Field';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { useCreateDeck } from '../../hooks/useManage';
import { colors } from '../../theme/colors';
import type { Difficulty } from '../../types/deck';

const LEVELS: { v: Difficulty; label: string }[] = [
  { v: 'BEGINNER', label: 'Cơ bản' },
  { v: 'INTERMEDIATE', label: 'Trung cấp' },
  { v: 'ADVANCED', label: 'Nâng cao' },
];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <YStack paddingHorizontal={14} paddingVertical={8} borderRadius={20}
        backgroundColor={active ? colors.primary : colors.card} borderWidth={1}
        borderColor={active ? colors.primary : colors.border}>
        <Text color={active ? '#fff' : colors.text} fontWeight="600" fontSize={13}>{label}</Text>
      </YStack>
    </Pressable>
  );
}

export default function NewDeck() {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📘');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('BEGINNER');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');
  const create = useCreateDeck();

  function submit() {
    if (!title.trim()) { setError('Nhập tên bộ từ'); return; }
    setError('');
    create.mutate(
      {
        title: title.trim(),
        emoji: emoji.trim() || undefined,
        topic: topic.trim() || undefined,
        description: description.trim() || undefined,
        difficulty,
        isPublic,
      },
      {
        onSuccess: (d) => router.replace(`/deck/${d.id}` as never),
        onError: (e) => setError(errorMessage(e)),
      },
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text color={colors.primary} fontWeight="700" fontSize={16}>‹ Quay lại</Text>
        </Pressable>
        <Text fontSize={26} fontWeight="800" color={colors.text}>Tạo bộ từ</Text>

        <Field label="Tên bộ từ" value={title} onChangeText={setTitle} autoCapitalize="sentences" />
        <Field label="Emoji" value={emoji} onChangeText={setEmoji} maxLength={4} />
        <Field label="Chủ đề" value={topic} onChangeText={setTopic} autoCapitalize="sentences" />
        <Field label="Mô tả" value={description} onChangeText={setDescription} autoCapitalize="sentences" />

        <YStack gap={8}>
          <Text color={colors.muted} fontSize={13} fontWeight="600">Trình độ</Text>
          <XStack gap={8} flexWrap="wrap">
            {LEVELS.map((l) => <Chip key={l.v} label={l.label} active={difficulty === l.v} onPress={() => setDifficulty(l.v)} />)}
          </XStack>
        </YStack>

        <YStack gap={8}>
          <Text color={colors.muted} fontSize={13} fontWeight="600">Hiển thị</Text>
          <XStack gap={8}>
            <Chip label="🔒 Riêng tư" active={!isPublic} onPress={() => setIsPublic(false)} />
            <Chip label="🌐 Công khai" active={isPublic} onPress={() => setIsPublic(true)} />
          </XStack>
        </YStack>

        {error ? <Text color={colors.danger}>{error}</Text> : null}
        <PrimaryButton title="Tạo bộ từ" onPress={submit} loading={create.isPending} />
      </ScrollView>
    </Screen>
  );
}