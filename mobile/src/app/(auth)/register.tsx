import { Link } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { authApi } from "../../api/auth";
import { errorMessage } from "../../api/client";
import {
  AuthButton,
  AuthField,
  AuthShell,
  ErrorBox,
  GoogleButton,
  OrDivider,
} from "../../components/auth/AuthShell";
import { useGoogleLogin } from "../../hooks/useGoogleLogin";
import { useAuthStore } from "../../store/auth";

export default function Register() {
  const setSession = useAuthStore((s) => s.setSession);
  const google = useGoogleLogin();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Nhập đủ tên, email và mật khẩu (tối thiểu 6 ký tự)");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authApi.register(
        name.trim(),
        email.trim().toLowerCase(),
        password,
      );
      await setSession(res.accessToken, res.user);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={"Chào mừng,\nTạo tài khoản nhé!"}
      footer={
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#fff", fontSize: 14 }}>
            Đã có tài khoản?{" "}
            <Link href="/login" style={{ color: "#FFB4AA", fontWeight: "800" }}>
              Đăng nhập
            </Link>
          </Text>
        </View>
      }
    >
      <AuthField
        icon="person-outline"
        value={name}
        onChangeText={setName}
        placeholder="Tên hiển thị"
        autoCapitalize="words"
      />
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
        placeholder="Mật khẩu (tối thiểu 6 ký tự)"
        secureTextEntry
      />
      <AuthField
        icon="lock-closed-outline"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Xác nhận mật khẩu"
        secureTextEntry
      />

      <ErrorBox text={error || google.error} />

      <View style={{ height: 6 }} />
      <AuthButton title="Đăng ký" onPress={submit} loading={loading} />
      <OrDivider label="Hoặc đăng ký bằng" />
      <GoogleButton
        title="Đăng ký với Google"
        onPress={google.run}
        loading={google.loading}
      />
    </AuthShell>
  );
}
