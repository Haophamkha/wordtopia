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

export default function Register() {
  const setSession = useAuthStore((s) => s.setSession);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Nhập đủ tên, email và mật khẩu (tối thiểu 6 ký tự)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register(name.trim(), email.trim().toLowerCase(), password);
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
            <Text fontSize={48}>✨</Text>
            <Text fontSize={28} fontWeight="800" color={colors.primary}>Tạo tài khoản</Text>
          </YStack>

          <Field label="Tên hiển thị" value={name} onChangeText={setName} placeholder="Hào" autoCapitalize="words" />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="ban@email.com" keyboardType="email-address" />
          <Field label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="Tối thiểu 6 ký tự" secureTextEntry />

          {error ? <Text color={colors.danger}>{error}</Text> : null}

          <PrimaryButton title="Đăng ký" onPress={submit} loading={loading} />

          <YStack flexDirection="row" justifyContent="center" gap={6}>
            <Text color={colors.muted}>Đã có tài khoản?</Text>
            <Link href="/login" style={{ color: colors.primary, fontWeight: '700' }}>Đăng nhập</Link>
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  );
}