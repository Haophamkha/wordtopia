import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { authApi } from '../../api/auth';
import { errorMessage } from '../../api/client';
import { AuthButton, AuthShell, ErrorBox } from '../../components/auth/AuthShell';

const LEN = 6;
const COOLDOWN = 60;

export default function VerifyOtp() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(true);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(COOLDOWN);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function submit() {
    if (code.length !== LEN) {
      setError('Nhập đủ mã gồm 6 số');
      return;
    }
    setError('');
    router.push({ pathname: '/reset-password', params: { email, code } });
  }

  async function resend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setInfo('');
    try {
      await authApi.forgotPassword(email);
      setCode('');
      setCooldown(COOLDOWN);
      setInfo('Đã gửi lại mã, hãy kiểm tra email (cả mục Spam)');
      inputRef.current?.focus();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setResending(false);
    }
  }

  const activeIndex = Math.min(code.length, LEN - 1);

  return (
    <AuthShell
      title={'Nhập mã OTP\nĐã gửi qua email'}
      footer={
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>
            Sai email?{' '}
            <Link href="/forgot-password" style={{ color: '#FFB4AA', fontWeight: '800' }}>
              Quay lại
            </Link>
          </Text>
        </View>
      }
    >
      <Text style={{ color: '#fff', fontSize: 14, marginBottom: 14 }}>
        Mã gồm 6 số đã được gửi tới {email} (hiệu lực 10 phút)
      </Text>

      <View style={{ height: 58, marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {Array.from({ length: LEN }).map((_, i) => {
            const active = focused && i === activeIndex;
            return (
              <View
                key={i}
                style={{
                  width: 46,
                  height: 58,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  borderWidth: 2,
                  borderColor: active ? '#fff' : 'rgba(255,255,255,0.28)',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>
                  {code[i] ?? ''}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Ô nhập ẩn phủ lên 6 ô: bấm vào đâu cũng nhập được, dán cả 6 số cũng được */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/\D/g, '').slice(0, LEN));
            setError('');
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={LEN}
          autoFocus
          caretHidden
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0,
          }}
        />
      </View>

      <ErrorBox text={error} />
      {!!info && <Text style={{ color: '#fff', fontSize: 13, marginTop: 8 }}>{info}</Text>}

      <View style={{ height: 6 }} />
      <AuthButton title="Tiếp tục" onPress={submit} loading={false} />

      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <Text
          onPress={cooldown > 0 || resending ? undefined : resend}
          style={{
            color: '#FFB4AA',
            fontWeight: '700',
            fontSize: 14,
            opacity: cooldown > 0 || resending ? 0.5 : 1,
          }}
        >
          {resending
            ? 'Đang gửi...'
            : cooldown > 0
              ? `Gửi lại mã sau ${cooldown}s`
              : 'Gửi lại mã'}
        </Text>
      </View>
    </AuthShell>
  );
}