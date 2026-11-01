import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../api/client';
import { useGenerateDeck } from '../hooks/useDecks';
import { colors } from '../theme/colors';
import type { Difficulty } from '../types/deck';
import { Field } from './ui/Field';
import { PrimaryButton } from './ui/PrimaryButton';

const LEVELS: { v: Difficulty; label: string }[] = [
  { v: 'BEGINNER', label: 'Cơ bản' },
  { v: 'INTERMEDIATE', label: 'Trung cấp' },
  { v: 'ADVANCED', label: 'Nâng cao' },
];
const COUNTS = [5, 8, 10, 15];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <YStack paddingHorizontal={14} paddingVertical={8} borderRadius={20}
        backgroundColor={active ? colors.primary : colors.bg}>
        <Text color={active ? '#fff' : colors.text} fontWeight="600" fontSize={13}>{label}</Text>
      </YStack>
    </Pressable>
  );
}

export function GenerateDeckModal({ visible, onClose, onDone }: {
  visible: boolean; onClose: () => void; onDone: (deckId: number) => void;
}) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(8);
  const [level, setLevel] = useState<Difficulty>('INTERMEDIATE');
  const [error, setError] = useState('');
  const gen = useGenerateDeck();

  function submit() {
    if (!topic.trim()) { setError('Nhập chủ đề'); return; }
    setError('');
    gen.mutate({ topic: topic.trim(), count, level }, {
      onSuccess: (deck) => { setTopic(''); onDone(deck.id); },
      onError: (e) => setError(errorMessage(e)),
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <YStack backgroundColor="#fff" borderTopLeftRadius={24} borderTopRightRadius={24} padding={20} gap={16}>
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={20} fontWeight="800" color={colors.text}>🤖 Tạo bộ từ bằng AI</Text>
            <Pressable onPress={onClose}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
          </XStack>

          <Field label="Chủ đề" value={topic} onChangeText={setTopic} placeholder="VD: Travel, Food, Business..." />

          <YStack gap={8}>
            <Text color={colors.muted} fontSize={13} fontWeight="600">Số từ</Text>
            <XStack gap={8} flexWrap="wrap">
              {COUNTS.map((c) => <Chip key={c} label={String(c)} active={count === c} onPress={() => setCount(c)} />)}
            </XStack>
          </YStack>

          <YStack gap={8}>
            <Text color={colors.muted} fontSize={13} fontWeight="600">Trình độ</Text>
            <XStack gap={8} flexWrap="wrap">
              {LEVELS.map((l) => <Chip key={l.v} label={l.label} active={level === l.v} onPress={() => setLevel(l.v)} />)}
            </XStack>
          </YStack>

          {error ? <Text color={colors.danger}>{error}</Text> : null}
          {gen.isPending ? <Text color={colors.muted} textAlign="center">AI đang tạo, chờ vài giây...</Text> : null}

          <PrimaryButton title="Tạo bộ từ" onPress={submit} loading={gen.isPending} />
        </YStack>
      </View>
    </Modal>
  );
}