import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../api/client';
import { pathApi } from '../api/path';
import { surveyApi } from '../api/survey';
import { OptionButton } from '../components/exercises/ui';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { useAuthStore } from '../store/auth';
import { useSurveyStore } from '../store/survey';
import { colors } from '../theme/colors';

const PURPOSES = [
  { v: 'communication', label: '💬 Giao tiếp hằng ngày' },
  { v: 'travel', label: '✈️ Đi du lịch' },
  { v: 'work', label: '💼 Công việc' },
  { v: 'exam', label: '🎓 Thi cử, học thuật' },
  { v: 'fun', label: '🎬 Xem phim, nghe nhạc' },
];

const LEVELS = [
  { v: 'BEGINNER', label: '🌱 Mới bắt đầu · biết vài từ đơn giản' },
  { v: 'INTERMEDIATE', label: '🌿 Biết một ít · nói được câu đơn giản' },
  { v: 'ADVANCED', label: '🌳 Khá tốt · muốn mở rộng vốn từ' },
];

const GOALS = [
  { v: 5, label: '5 từ / ngày · Nhẹ nhàng' },
  { v: 10, label: '10 từ / ngày · Vừa phải' },
  { v: 15, label: '15 từ / ngày · Nghiêm túc' },
  { v: 20, label: '20 từ / ngày · Thử thách' },
];

const TITLES = ['Bạn học tiếng Anh để làm gì?', 'Bạn tự đánh giá trình độ hiện tại?', 'Mục tiêu học mỗi ngày?'];

export default function Survey() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const save = useSurveyStore((s) => s.save);

  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [goal, setGoal] = useState<number>(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!token || !user) return <Redirect href="/login" />;

  const canNext = step === 0 ? purpose !== null : step === 1 ? level !== null : true;

  async function skip() {
    await pathApi.skipPlacement().catch(() => undefined);
    await save(user!.id, null);
    router.replace('/(tabs)/home' as never);
  }

  async function finish() {
    setSaving(true);
    setError('');
    try {
      await surveyApi.setDailyGoal(goal);
      await pathApi.saveSurvey({ purpose: purpose ?? '', selfLevel: level ?? '' }).catch((e) => console.warn('saveSurvey lỗi', e));
      const { token: t, user: u, setSession } = useAuthStore.getState();
      if (t && u) await setSession(t, { ...u, dailyGoal: goal });
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
      return;
    }
    await save(user!.id, { purpose: purpose ?? '', selfLevel: level ?? '', dailyGoal: goal });
    router.replace('/placement' as never);
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack padding={20} paddingBottom={8} gap={14} alignItems="center">
        {step > 0 ? (
          <Pressable onPress={() => setStep(step - 1)}><Text fontSize={24} color={colors.muted}>‹</Text></Pressable>
        ) : null}
        <YStack flex={1} height={10} borderRadius={5} backgroundColor={colors.border} overflow="hidden">
          <YStack height={10} width={`${((step + 1) / 3) * 100}%`} backgroundColor={colors.primary} borderRadius={5} />
        </YStack>
        <Pressable onPress={skip}><Text color={colors.muted} fontSize={13}>Bỏ qua</Text></Pressable>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}>
        <YStack gap={6} marginTop={8}>
          <Text color={colors.muted} fontSize={13}>Câu {step + 1}/3</Text>
          <Text fontSize={26} fontWeight="800" color={colors.text}>{TITLES[step]}</Text>
          {step === 1 ? (
            <Text color={colors.muted} fontSize={13}>Bài test ở bước sau sẽ xếp trình độ chính xác cho bạn.</Text>
          ) : null}
        </YStack>

        <YStack gap={10}>
          {step === 0 && PURPOSES.map((o) => (
            <OptionButton key={o.v} label={o.label} state={purpose === o.v ? 'selected' : 'idle'} onPress={() => setPurpose(o.v)} />
          ))}
          {step === 1 && LEVELS.map((o) => (
            <OptionButton key={o.v} label={o.label} state={level === o.v ? 'selected' : 'idle'} onPress={() => setLevel(o.v)} />
          ))}
          {step === 2 && GOALS.map((o) => (
            <OptionButton key={o.v} label={o.label} state={goal === o.v ? 'selected' : 'idle'} onPress={() => setGoal(o.v)} />
          ))}
        </YStack>

        {error ? <Text color={colors.danger}>{error}</Text> : null}

        {step < 2 ? (
          <PrimaryButton title="Tiếp" disabled={!canNext} onPress={() => setStep(step + 1)} />
        ) : (
          <PrimaryButton title="Hoàn tất, làm bài test đầu vào" loading={saving} onPress={finish} />
        )}
      </ScrollView>
    </Screen>
  );
}