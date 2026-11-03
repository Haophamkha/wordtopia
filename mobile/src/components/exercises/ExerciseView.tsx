import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, TextInput } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { colors } from '../../theme/colors';
import type { Exercise } from '../../types/lesson';
import { PrimaryButton } from '../ui/PrimaryButton';
import { FeedbackBar, OptionButton, speak, SpeakButton, type OptionState } from './ui';

export interface Result {
  wordId: number;
  correct: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Header({ label, title, sub, speakText }: { label: string; title: string; sub?: string | null; speakText?: string }) {
  return (
    <YStack alignItems="center" gap={8}>
      <Text color={colors.muted} fontSize={13}>{label}</Text>
      <Text fontSize={34} fontWeight="800" color={colors.text}>{title}</Text>
      {sub ? <Text color={colors.muted}>{sub}</Text> : null}
      {speakText ? <SpeakButton text={speakText} /> : null}
    </YStack>
  );
}

function ListenHeader({ term }: { term: string }) {
  useEffect(() => {
    speak(term);
  }, [term]);
  return (
    <YStack alignItems="center" gap={12}>
      <Text color={colors.muted} fontSize={13}>Nghe và chọn từ bạn nghe được</Text>
      <SpeakButton text={term} />
    </YStack>
  );
}

function Choice({ wordId, header, options, answer, onDone }: {
  wordId: number; header: ReactNode; options: string[]; answer: string; onDone: (r: Result[]) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const done = picked !== null;
  const correct = picked === answer;
  return (
    <YStack gap={18}>
      {header}
      <YStack gap={10}>
        {options.map((o, i) => {
          let state: OptionState = 'idle';
          if (done) state = o === answer ? 'correct' : o === picked ? 'wrong' : 'dim';
          return <OptionButton key={`${i}-${o}`} label={o} state={state} disabled={done} onPress={() => setPicked(o)} />;
        })}
      </YStack>
      {done ? <FeedbackBar correct={correct} answer={answer} onNext={() => onDone([{ wordId, correct }])} /> : null}
    </YStack>
  );
}

function MatchPairs({ ex, onDone }: { ex: Extract<Exercise, { type: 'match_pairs' }>; onDone: (r: Result[]) => void }) {
  const meanings = useMemo(() => shuffle(ex.pairs), [ex.id]);
  const [sel, setSel] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [flash, setFlash] = useState<{ t: number; m: number } | null>(null);
  const [mistakes, setMistakes] = useState<number[]>([]);
  const finished = matched.length === ex.pairs.length;

  function tapMeaning(id: number) {
    if (sel === null || matched.includes(id)) return;
    if (sel === id) {
      setMatched((m) => [...m, id]);
    } else {
      const t = sel;
      setMistakes((m) => (m.includes(t) ? m : [...m, t]));
      setFlash({ t, m: id });
      setTimeout(() => setFlash(null), 600);
    }
    setSel(null);
  }

  return (
    <YStack gap={18}>
      <YStack alignItems="center" gap={4}>
        <Text fontSize={20} fontWeight="800" color={colors.text}>Ghép từ với nghĩa</Text>
        <Text color={colors.muted} fontSize={13}>Chạm một từ, rồi chạm nghĩa tương ứng</Text>
      </YStack>
      <XStack gap={12}>
        <YStack flex={1} gap={10}>
          {ex.pairs.map((p) => {
            let state: OptionState = 'idle';
            if (matched.includes(p.wordId)) state = 'correct';
            else if (flash?.t === p.wordId) state = 'wrong';
            else if (sel === p.wordId) state = 'selected';
            return (
              <OptionButton
                key={p.wordId}
                label={p.term}
                state={state}
                disabled={matched.includes(p.wordId)}
                onPress={() => {
                  setSel(p.wordId);
                  speak(p.term);
                }}
              />
            );
          })}
        </YStack>
        <YStack flex={1} gap={10}>
          {meanings.map((p) => {
            let state: OptionState = 'idle';
            if (matched.includes(p.wordId)) state = 'correct';
            else if (flash?.m === p.wordId) state = 'wrong';
            return (
              <OptionButton
                key={p.wordId}
                label={p.meaning}
                state={state}
                disabled={matched.includes(p.wordId)}
                onPress={() => tapMeaning(p.wordId)}
              />
            );
          })}
        </YStack>
      </XStack>
      {finished ? (
        <PrimaryButton
          title="Tiếp tục"
          onPress={() => onDone(ex.pairs.map((p) => ({ wordId: p.wordId, correct: !mistakes.includes(p.wordId) })))}
        />
      ) : null}
    </YStack>
  );
}

function Chip({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: '#fff', borderColor: colors.border, borderWidth: 2, borderRadius: 12,
        paddingVertical: 8, paddingHorizontal: 12,
      }}
    >
      <Text fontSize={16} fontWeight="600" color={colors.text}>{label}</Text>
    </Pressable>
  );
}

function OrderSentence({ ex, onDone }: { ex: Extract<Exercise, { type: 'order_sentence' }>; onDone: (r: Result[]) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const built = picked.map((i) => ex.tokens[i]).join(' ');
  const correct = built === ex.answer;

  return (
    <YStack gap={18}>
      <YStack gap={6}>
        <Text color={colors.muted} fontSize={13}>Sắp xếp thành câu đúng</Text>
        <Text fontSize={18} fontWeight="700" color={colors.text}>{ex.translation}</Text>
      </YStack>

      <XStack
        flexWrap="wrap"
        gap={8}
        minHeight={70}
        padding={12}
        borderRadius={14}
        borderWidth={2}
        borderColor={checked ? (correct ? colors.success : colors.danger) : colors.border}
        backgroundColor="#fff"
      >
        {picked.map((idx, pos) => (
          <Chip
            key={`${pos}-${idx}`}
            label={ex.tokens[idx]}
            disabled={checked}
            onPress={() => setPicked((p) => p.filter((_, k) => k !== pos))}
          />
        ))}
      </XStack>

      <XStack flexWrap="wrap" gap={8}>
        {ex.tokens.map((t, idx) =>
          picked.includes(idx) ? (
            <YStack key={idx} paddingVertical={8} paddingHorizontal={12} borderRadius={12} backgroundColor={colors.border} opacity={0.5}>
              <Text fontSize={16} color="transparent">{t}</Text>
            </YStack>
          ) : (
            <Chip key={idx} label={t} disabled={checked} onPress={() => setPicked((p) => [...p, idx])} />
          ),
        )}
      </XStack>

      {checked ? (
        <FeedbackBar correct={correct} answer={ex.answer} onNext={() => onDone([{ wordId: ex.wordId, correct }])} />
      ) : (
        <PrimaryButton title="Kiểm tra" disabled={picked.length === 0} onPress={() => setChecked(true)} />
      )}
    </YStack>
  );
}

function TypeWord({ ex, onDone }: { ex: Extract<Exercise, { type: 'type_word' }>; onDone: (r: Result[]) => void }) {
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);
  const correct = value.trim().toLowerCase() === ex.answer.trim().toLowerCase();

  return (
    <YStack gap={18}>
      <YStack alignItems="center" gap={6}>
        <Text color={colors.muted} fontSize={13}>Gõ từ tiếng Anh có nghĩa</Text>
        <Text fontSize={30} fontWeight="800" color={colors.text}>{ex.meaning}</Text>
        {ex.hint ? <Text fontSize={20} color={colors.primary} letterSpacing={3}>{ex.hint}</Text> : null}
      </YStack>

      <TextInput
        value={value}
        onChangeText={setValue}
        editable={!checked}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Nhập đáp án..."
        placeholderTextColor={colors.muted}
        onSubmitEditing={() => value.trim() && setChecked(true)}
        style={{
          backgroundColor: '#fff', borderColor: checked ? (correct ? colors.success : colors.danger) : colors.border,
          borderWidth: 2, borderRadius: 14, height: 54, paddingHorizontal: 16, fontSize: 20, color: colors.text,
        }}
      />

      {checked ? (
        <FeedbackBar correct={correct} answer={ex.answer} onNext={() => onDone([{ wordId: ex.wordId, correct }])} />
      ) : (
        <PrimaryButton title="Kiểm tra" disabled={!value.trim()} onPress={() => setChecked(true)} />
      )}
    </YStack>
  );
}

export function ExerciseView({ exercise: ex, onDone }: { exercise: Exercise; onDone: (r: Result[]) => void }) {
  switch (ex.type) {
    case 'match_pairs':
      return <MatchPairs ex={ex} onDone={onDone} />;
    case 'choose_meaning':
      return (
        <Choice wordId={ex.wordId} options={ex.options} answer={ex.answer} onDone={onDone}
          header={<Header label="Chọn nghĩa đúng của từ" title={ex.term} sub={ex.phonetic} speakText={ex.term} />} />
      );
    case 'listen_choose':
      return <Choice wordId={ex.wordId} options={ex.options} answer={ex.answer} onDone={onDone} header={<ListenHeader term={ex.term} />} />;
    case 'fill_blank':
      return (
        <Choice wordId={ex.wordId} options={ex.options} answer={ex.answer} onDone={onDone}
          header={
            <YStack gap={8}>
              <Text color={colors.muted} fontSize={13}>Điền từ còn thiếu</Text>
              <Text fontSize={22} fontWeight="700" color={colors.text}>{ex.sentence}</Text>
              <Text color={colors.muted}>{ex.translation}</Text>
            </YStack>
          } />
      );
    case 'synonym':
      return (
        <Choice wordId={ex.wordId} options={ex.options} answer={ex.answer} onDone={onDone}
          header={<Header label="Chọn từ đồng nghĩa với" title={ex.term} />} />
      );
    case 'order_sentence':
      return <OrderSentence ex={ex} onDone={onDone} />;
    case 'type_word':
      return <TypeWord ex={ex} onDone={onDone} />;
    default:
      return null;
  }
}