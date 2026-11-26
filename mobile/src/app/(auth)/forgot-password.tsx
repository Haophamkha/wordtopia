import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { authApi } from '../../api/auth';
import { errorMessage } from '../../api/client';
import { AuthButton, AuthField, AuthShell, ErrorBox } from '../../components/auth/AuthShell';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!email.trim()) {
      setError('Nhập email của bạn');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const mail = email.trim().toLowerCase();
      await authApi.forgotPassword(mail);
      router.push({ pathname: '/verify-otp', params: { email: mail } });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={'Quên mật khẩu?\nĐừng lo nhé!'}
      footer={
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>
            Nhớ ra rồi?{' '}
            <Link href="/login" style={{ color: '#FFB4AA', fontWeight: '800' }}>
              Đăng nhập
            </Link>
          </Text>
        </View>
      }
    >
      <AuthField
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="Email đã đăng ký"
        keyboardType="email-address"
      />
      <ErrorBox text={error} />
      <View style={{ height: 6 }} />
      <AuthButton title="Gửi mã OTP" onPress={submit} loading={loading} />
    </AuthShell>
  );
}