import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, XStack } from 'tamagui';
import { authApi } from '../../api/auth';
import { errorMessage } from '../../api/client';
import { AuthShell, ErrorBox, GoogleButton, OrDivider } from '../../components/auth/AuthShell';
import { Field } from '../../components/ui/Field';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useGoogleLogin } from '../../hooks/useGoogleLogin';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';

export default function Register() {
  const setSession = useAuthStore((s) => s.setSession);
  const google = useGoogleLogin();
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
    <AuthShell
      emoji="✨"
      title="Tạo tài khoản"
      subtitle="Bắt đầu hành trình học từ vựng của bạn"
      footer={
        <XStack justifyContent="center" gap={6}>
          <Text color={colors.muted}>Đã có tài khoản?</Text>
          <Link href="/login" style={{ color: colors.primary, fontWeight: '700' }}>Đăng nhập</Link>
        </XStack>
      }
    >
      <Field label="Tên hiển thị" icon="person-outline" value={name} onChangeText={setName} placeholder="Hào" autoCapitalize="words" />
      <Field label="Email" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="ban@email.com" keyboardType="email-address" />
      <Field label="Mật khẩu" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="Tối thiểu 6 ký tự" secureTextEntry />

      <ErrorBox text={error || google.error} />

      <PrimaryButton title="Đăng ký" onPress={submit} loading={loading} />
      <OrDivider />
      <GoogleButton title="Đăng ký bằng Google" onPress={google.run} loading={google.loading} />
    </AuthShell>
  );
}