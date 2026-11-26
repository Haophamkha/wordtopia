import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { BrandLogo } from './BrandLogo';

export const AUTH = {
  top: '#7461EE',
  bottom: '#4330B5',
  coral: '#FF7A6B',
  field: 'rgba(255,255,255,0.2)',
  soft: 'rgba(255,255,255,0.78)',
  line: 'rgba(255,255,255,0.35)',
};

export function AuthShell({
  title,
  children,
  footer,
  showBack = true,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
  emoji?: string;
  subtitle?: string;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const canBack = showBack && router.canGoBack();
  return (
    <View style={{ flex: 1, backgroundColor: AUTH.bottom }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[AUTH.top, AUTH.bottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Svg width={220} height={210} viewBox="0 0 220 210" style={{ position: 'absolute', top: 0, right: 0 }}>
        <Path
          d="M78 0 H220 V92 C186 78 150 98 134 142 C120 182 92 214 60 186 C30 158 68 108 76 62 C80 36 68 16 78 0 Z"
          fill={AUTH.coral}
        />
      </Svg>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + (canBack ? 58 : 18),
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandLogo />
          <View style={{ height: 96 }} />
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 36 }}>{title}</Text>
          <View style={{ marginTop: 26, gap: 14 }}>{children}</View>
          <View style={{ flex: 1, minHeight: 28 }} />
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
      {canBack && (
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={({ pressed }) => ({
            position: 'absolute',
            top: insets.top + 10,
            left: 14,
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={30} color="#fff" />
        </Pressable>
      )}    </View>
  );
}

export function AuthField({
  icon,
  secureTextEntry,
  style,
  ...rest
}: TextInputProps & { icon: keyof typeof Ionicons.glyphMap }) {
  const [show, setShow] = useState(false);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        borderRadius: 27,
        paddingHorizontal: 22,
        gap: 10,
        backgroundColor: AUTH.field,
      }}
    >
      <TextInput
        placeholderTextColor={AUTH.soft}
        selectionColor="#fff"
        autoCapitalize="none"
        secureTextEntry={!!secureTextEntry && !show}
        style={[{ flex: 1, height: '100%', paddingVertical: 0, fontSize: 15, color: '#fff' }, style]}
        {...rest}
      />
      {secureTextEntry ? (
        <Pressable onPress={() => setShow((s) => !s)} hitSlop={12}>
          <Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} size={22} color={AUTH.soft} />
        </Pressable>
      ) : (
        <Ionicons name={icon} size={20} color={AUTH.soft} />
      )}
    </View>
  );
}

export function AuthButton({ title, onPress, loading }: { title: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        height: 54,
        borderRadius: 27,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        opacity: loading ? 0.75 : pressed ? 0.9 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={AUTH.bottom} />
      ) : (
        <>
          <Text style={{ color: AUTH.bottom, fontSize: 16, fontWeight: '700' }}>{title}</Text>
          <Ionicons name="arrow-forward" size={18} color={AUTH.bottom} />
        </>
      )}
    </Pressable>
  );
}

export function ErrorBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFEDEA',
        borderRadius: 16,
        padding: 12,
      }}
    >
      <Ionicons name="alert-circle" size={20} color="#D93C3C" />
      <Text style={{ flex: 1, color: '#B42323', fontSize: 14 }}>{text}</Text>
    </View>
  );
}

export function OrDivider({ label = 'Hoặc' }: { label?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: AUTH.line }} />
      <Text style={{ color: AUTH.soft, fontSize: 13 }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: AUTH.line }} />
    </View>
  );
}

export function GoogleButton({ title, onPress, loading }: { title: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        height: 54,
        borderRadius: 27,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        opacity: loading ? 0.75 : pressed ? 0.9 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={AUTH.bottom} />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#EA4335" />
          <Text style={{ color: '#2B2B3C', fontSize: 15, fontWeight: '600' }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}