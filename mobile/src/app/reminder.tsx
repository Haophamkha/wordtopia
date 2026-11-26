import { Alert } from '../components/ui/AppDialog';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { OptionButton } from '../components/exercises/ui';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { disableReminder, enableReminder, loadReminder } from '../lib/reminder';
import { preferServerReminder, syncReminderHour } from '../lib/push';
import { colors } from '../theme/colors';

const HOURS = [
  { v: 7, label: '🌅 7:00 sáng' },
  { v: 12, label: '☀️ 12:00 trưa' },
  { v: 20, label: '🌙 20:00 tối' },
  { v: 21, label: '😴 21:00 trước khi ngủ' },
];

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/home' as never);
}

export default function Reminder() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadReminder().then((s) => {
      setEnabled(s.enabled);
      setHour(s.hour);
    });
  }, []);

  async function apply(nextEnabled: boolean, nextHour: number) {
    setBusy(true);
    try {
      if (nextEnabled) {
        const ok = await enableReminder(nextHour);
        if (!ok) {
          Alert.alert('Chưa có quyền', 'Hãy cho phép thông báo trong Cài đặt của điện thoại.');
          setEnabled(false);
          return;
        }
      } else {
        await disableReminder(nextHour);
        syncReminderHour(null);
      }
      if (nextEnabled) await preferServerReminder(nextHour);
      setEnabled(nextEnabled);
      setHour(nextHour);
    } catch (e) {
      Alert.alert('Không đặt được nhắc nhở', String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack padding={20} paddingBottom={8} alignItems="center" justifyContent="space-between">
        <Text fontSize={24} fontWeight="800" color={colors.text}>⏰ Nhắc học hằng ngày</Text>
        <Pressable onPress={goBack}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
      </XStack>

      <YStack padding={20} gap={12}>
        <Text color={colors.muted}>Chọn giờ nhận thông báo mỗi ngày:</Text>
        {HOURS.map((o) => (
          <OptionButton
            key={o.v}
            label={o.label}
            state={hour === o.v ? 'selected' : 'idle'}
            onPress={() => (enabled ? apply(true, o.v) : setHour(o.v))}
          />
        ))}
        <YStack marginTop={8}>
          {enabled ? (
            <PrimaryButton title="Tắt nhắc nhở" variant="outline" loading={busy} onPress={() => apply(false, hour)} />
          ) : (
            <PrimaryButton title="Bật nhắc nhở" loading={busy} onPress={() => apply(true, hour)} />
          )}
        </YStack>
        {enabled ? <Text color={colors.success}>✓ Đang bật, nhắc lúc {hour}:00 mỗi ngày</Text> : null}
      </YStack>
    </Screen>
  );
}