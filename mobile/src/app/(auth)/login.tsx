import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { authApi } from '../../api/auth';
import { errorMessage } from '../../api/client';
import {
  AuthButton,
  AuthField,
  AuthShell,
  ErrorBox,
  GoogleButton,
  OrDivider,
} from '../../components/auth/AuthShell';
import { useGoogleLogin } from '../../hooks/useGoogleLogin';
import { useAuthStore } from '../../store/auth';

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
      showBack={false}
      title={'Chào bạn,\nĐăng nhập nhé!'}
      footer={
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>
            Chưa có tài khoản?{' '}
            <Link href="/register" style={{ color: '#FFB4AA', fontWeight: '800' }}>
              Đăng ký
            </Link>
          </Text>
        </View>
      }
    >
      <AuthField
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />
      <AuthField
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        placeholder="Mật khẩu"
        secureTextEntry
      />

      <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
        <Link href="/forgot-password" style={{ color: '#FFB4AA', fontWeight: '700', fontSize: 13 }}>
          Quên mật khẩu?
        </Link>
      </View>

      <ErrorBox text={error || google.error} />

      <View style={{ height: 6 }} />
      <AuthButton title="Đăng nhập" onPress={submit} loading={loading} />
      <OrDivider label="Hoặc đăng nhập bằng" />
      <GoogleButton title="Đăng nhập với Google" onPress={google.run} loading={google.loading} />
    </AuthShell>
  );
}