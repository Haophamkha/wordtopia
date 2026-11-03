import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../api/client';
import { usersApi } from '../api/users';
import { Avatar } from '../components/ui/Avatar';
import { Field } from '../components/ui/Field';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { AvatarError, pickAvatar } from '../lib/avatar';
import { useAuthStore } from '../store/auth';
import { colors } from '../theme/colors';

const GOALS = [5, 10, 15, 20, 30];

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/profile' as never);
}

export default function PersonalInfo() {
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);
  const qc = useQueryClient();

  const [name, setName] = useState(user?.name ?? '');
  const [goal, setGoal] = useState(user?.dailyGoal ?? 10);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);

  const avatar = (user as { avatar?: string | null } | null)?.avatar ?? null;
  const infoChanged = name.trim() !== user?.name || goal !== (user?.dailyGoal ?? 10);
  const dirty = pendingUri !== null || infoChanged;

  function say(text: string, err = false) {
    setMsg(text);
    setIsErr(err);
  }

  async function choosePhoto() {
    if (saving) return;
    say('');
    try {
      const uri = await pickAvatar();
      if (uri) setPendingUri(uri);
    } catch (e) {
      say(e instanceof AvatarError ? e.message : errorMessage(e), true);
    }
  }

  async function save() {
    say('');
    setSaving(true);
    try {
      if (pendingUri) {
        const res = await usersApi.uploadAvatar(pendingUri);
        await patchUser({ avatar: res.avatar } as never);
        setPendingUri(null);
      }
      if (infoChanged) {
        await usersApi.update({ name: name.trim(), dailyGoal: goal });
        await patchUser({ name: name.trim(), dailyGoal: goal });
        qc.invalidateQueries({ queryKey: ['stats'] });
      }
      say('Đã lưu ✓');
    } catch (e) {
      say(errorMessage(e), true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack alignItems="center" paddingHorizontal={16} paddingVertical={12} borderBottomWidth={1} borderBottomColor={colors.border}>
        <Pressable onPress={goBack} hitSlop={12} style={{ width: 40 }}>
          <Ionicons name="arrow-back" size={26} color={colors.muted} />
        </Pressable>
        <Text flex={1} textAlign="center" fontSize={18} fontWeight="800" color={colors.muted}>Thông tin cá nhân</Text>
        <YStack width={40} />
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <YStack alignItems="center" gap={10} marginTop={4}>
          <Pressable onPress={choosePhoto} disabled={saving}>
            <YStack
              padding={6}
              borderRadius={70}
              borderWidth={3}
              borderStyle="dashed"
              borderColor={pendingUri ? colors.primary : colors.border}
              alignItems="center"
              justifyContent="center"
            >
              <YStack>
                <Avatar uri={pendingUri ?? avatar} name={user?.name} size={110} />
                <YStack
                  position="absolute"
                  right={0}
                  bottom={0}
                  width={34}
                  height={34}
                  borderRadius={17}
                  backgroundColor="#fff"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={1}
                  borderColor={colors.border}
                >
                  <Ionicons name="camera" size={18} color={colors.primary} />
                </YStack>
              </YStack>
            </YStack>
          </Pressable>

          <Pressable onPress={choosePhoto} disabled={saving}>
            <Text fontSize={14} fontWeight="800" color={colors.primary} letterSpacing={0.8}>THAY ẢNH ĐẠI DIỆN</Text>
          </Pressable>

          {pendingUri ? (
            <YStack alignItems="center" gap={4}>
              <Text fontSize={12} color={colors.muted} textAlign="center">
                Ảnh mới chưa được lưu. Bấm "Lưu thay đổi" để cập nhật.
              </Text>
              <Pressable onPress={() => setPendingUri(null)} disabled={saving} hitSlop={8}>
                <Text fontSize={12} fontWeight="700" color={colors.danger}>Bỏ ảnh vừa chọn</Text>
              </Pressable>
            </YStack>
          ) : (
            <Text fontSize={12} color={colors.muted} textAlign="center">
              JPG, PNG hoặc WebP · tối thiểu 200×200 px · tối đa 10MB
            </Text>
          )}
        </YStack>

        <Field label="Tên" value={name} onChangeText={setName} autoCapitalize="words" />
        <Field label="Email" value={user?.email ?? ''} editable={false} />

        <YStack gap={8}>
          <Text color={colors.muted} fontSize={13} fontWeight="600">Mục tiêu mỗi ngày (từ)</Text>
          <XStack gap={8} flexWrap="wrap">
            {GOALS.map((g) => (
              <Pressable key={g} onPress={() => setGoal(g)}>
                <YStack
                  paddingHorizontal={18}
                  paddingVertical={10}
                  borderRadius={20}
                  backgroundColor={goal === g ? colors.primary : colors.card}
                  borderWidth={1}
                  borderColor={goal === g ? colors.primary : colors.border}
                >
                  <Text color={goal === g ? '#fff' : colors.text} fontWeight="700">{g}</Text>
                </YStack>
              </Pressable>
            ))}
          </XStack>
        </YStack>

        {msg ? <Text color={isErr ? colors.danger : colors.success}>{msg}</Text> : null}

        <PrimaryButton title="Lưu thay đổi" onPress={save} loading={saving} disabled={!dirty || !name.trim()} />
      </ScrollView>
    </Screen>
  );
}