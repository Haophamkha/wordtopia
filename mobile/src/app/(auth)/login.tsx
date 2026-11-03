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

export default function Login() {
  const setSession = useAuthStore((s) => s.setSession);
  const google = useGoogleLogin();
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
    <AuthShell
      emoji="🌍"
      title="Wordtopia"
      subtitle="Học từ vựng tiếng Anh mỗi ngày"
      footer={
        <XStack justifyContent="center" gap={6}>
          <Text color={colors.muted}>Chưa có tài khoản?</Text>
          <Link href="/register" style={{ color: colors.primary, fontWeight: '700' }}>Đăng ký</Link>
        </XStack>
      }
    >
      <Field label="Email" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="ban@email.com" keyboardType="email-address" />
      <Field label="Mật khẩu" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="Nhập mật khẩu" secureTextEntry />

      <ErrorBox text={error || google.error} />

      <PrimaryButton title="Đăng nhập" onPress={submit} loading={loading} />
      <OrDivider />
      <GoogleButton title="Tiếp tục với Google" onPress={google.run} loading={google.loading} />
    </AuthShell>
  );
}