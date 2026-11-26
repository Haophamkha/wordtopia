import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { authApi } from '../../api/auth';
import { errorMessage } from '../../api/client';
import { AuthButton, AuthField, AuthShell, ErrorBox } from '../../components/auth/AuthShell';

export default function ResetPassword() {
  const router = useRouter();
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit() {
    if (password.length < 6) {
      setError('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(email, code, password);
      setDone(true);
      setTimeout(() => router.replace('/login'), 1500);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={'Đặt mật khẩu mới\nCho tài khoản của bạn'}
      footer={
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>
            Nhập sai mã?{' '}
            <Link
              href={{ pathname: '/verify-otp', params: { email } }}
              style={{ color: '#FFB4AA', fontWeight: '800' }}
            >
              Nhập lại
            </Link>
          </Text>
        </View>
      }
    >
      <AuthField
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
        secureTextEntry
      />
      <AuthField
        icon="lock-closed-outline"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Xác nhận mật khẩu mới"
        secureTextEntry
      />

      <ErrorBox text={error} />
      {done && (
        <Text style={{ color: '#fff', fontSize: 14, marginTop: 8 }}>
          Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...
        </Text>
      )}

      <View style={{ height: 6 }} />
      <AuthButton title="Đổi mật khẩu" onPress={submit} loading={loading} />
    </AuthShell>
  );
}