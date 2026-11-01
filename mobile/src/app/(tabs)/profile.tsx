import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../../api/client';
import { usersApi } from '../../api/users';
import { Field } from '../../components/ui/Field';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';

const GOALS = [5, 10, 15, 20, 30];

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const patchUser = useAuthStore((s) => s.patchUser);
  const qc = useQueryClient();

  const [name, setName] = useState(user?.name ?? '');
  const [goal, setGoal] = useState(user?.dailyGoal ?? 10);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);

  const save = useMutation({
    mutationFn: () => usersApi.update({ name: name.trim(), dailyGoal: goal }),
    onSuccess: async () => {
      await patchUser({ name: name.trim(), dailyGoal: goal });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setIsErr(false);
      setMsg('Đã lưu ✓');
    },
    onError: (e) => {
      setIsErr(true);
      setMsg(errorMessage(e));
    },
  });

  const dirty = name.trim() !== user?.name || goal !== (user?.dailyGoal ?? 10);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <YStack gap={20}>
          <YStack alignItems="center" gap={8} marginTop={10}>
            <YStack width={88} height={88} borderRadius={44} backgroundColor={colors.primary} alignItems="center" justifyContent="center">
              <Text color="#fff" fontSize={36} fontWeight="800">{user?.name?.charAt(0).toUpperCase()}</Text>
            </YStack>
            <Text fontSize={22} fontWeight="800" color={colors.text}>{user?.name}</Text>
            <Text color={colors.muted}>{user?.email}</Text>
          </YStack>

          <Field label="Tên hiển thị" value={name} onChangeText={setName} autoCapitalize="words" />

          <YStack gap={8}>
            <Text color={colors.muted} fontSize={13} fontWeight="600">Mục tiêu mỗi ngày (từ)</Text>
            <XStack gap={8} flexWrap="wrap">
              {GOALS.map((g) => (
                <Pressable key={g} onPress={() => setGoal(g)}>
                  <YStack paddingHorizontal={16} paddingVertical={9} borderRadius={20}
                    backgroundColor={goal === g ? colors.primary : colors.card}
                    borderWidth={1} borderColor={goal === g ? colors.primary : colors.border}>
                    <Text color={goal === g ? '#fff' : colors.text} fontWeight="700">{g}</Text>
                  </YStack>
                </Pressable>
              ))}
            </XStack>
          </YStack>

          {msg ? <Text color={isErr ? colors.danger : colors.success}>{msg}</Text> : null}

          <PrimaryButton title="Lưu thay đổi" onPress={() => { setMsg(''); save.mutate(); }}
            loading={save.isPending} disabled={!dirty || !name.trim()} />

          <PrimaryButton title="⭐ Từ yêu thích" variant="outline" onPress={() => router.push('/favorites' as never)} />

          <PrimaryButton title="Đăng xuất" variant="danger"
            onPress={async () => { qc.clear(); await logout(); }} />
        </YStack>
      </ScrollView>
    </Screen>
  );
}