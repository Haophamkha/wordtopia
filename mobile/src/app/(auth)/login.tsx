import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Text, YStack } from 'tamagui';
import { authApi } from '../../api/auth';
import { errorMessage } from '../../api/client';
import { Field } from '../../components/ui/Field';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';

export default function Login() {
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!email.trim() || !password) {
      setError('Nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      await setSession(res.accessToken, res.user);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <YStack gap={18}>
          <YStack alignItems="center" gap={6} marginBottom={12}>
            <Text fontSize={56}>🌍</Text>
            <Text fontSize={32} fontWeight="800" color={colors.primary}>Wordtopia</Text>
            <Text color={colors.muted}>Học từ vựng tiếng Anh mỗi ngày</Text>
          </YStack>

          <Field label="Email" value={email} onChangeText={setEmail} placeholder="ban@email.com" keyboardType="email-address" />
          <Field label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry />

          {error ? <Text color={colors.danger}>{error}</Text> : null}

          <PrimaryButton title="Đăng nhập" onPress={submit} loading={loading} />

          <YStack flexDirection="row" justifyContent="center" gap={6}>
            <Text color={colors.muted}>Chưa có tài khoản?</Text>
            <Link href="/register" style={{ color: colors.primary, fontWeight: '700' }}>Đăng ký</Link>
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  );
}