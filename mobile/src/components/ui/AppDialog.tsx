import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type IconName = keyof typeof Ionicons.glyphMap;
type Tone = 'default' | 'danger' | 'success';

export type DialogOptions = {
  title: string;
  message?: string;
  buttons: DialogButton[];
  icon?: IconName;
  tone?: Tone;
};

const TONES: Record<Tone, { bg: string; fg: string; icon: IconName }> = {
  default: { bg: '#EFEDFD', fg: colors.primary, icon: 'information-circle' },
  danger: { bg: '#FFEDEA', fg: '#E5484D', icon: 'warning' },
  success: { bg: '#E3F7EE', fg: '#2EB67D', icon: 'checkmark-circle' },
};

/* ---------- hàng đợi toàn cục ---------- */
let push: ((o: DialogOptions) => void) | null = null;
const pending: DialogOptions[] = [];

function show(o: DialogOptions) {
  if (push) push(o);
  else pending.push(o);
}

/* ---------- API tương thích Alert.alert của React Native ---------- */
export const Alert = {
  alert(title: string, message?: string, buttons?: DialogButton[]) {
    const btns = buttons && buttons.length ? buttons : [{ text: 'Đồng ý' }];
    const danger = btns.some((b) => b.style === 'destructive');
    show({ title, message, buttons: btns, tone: danger ? 'danger' : 'default' });
  },
};

/* ---------- API tiện dụng ---------- */
export const dialog = {
  alert(title: string, message?: string, opts?: { icon?: IconName; tone?: Tone; okText?: string }) {
    return new Promise<void>((resolve) => {
      show({
        title,
        message,
        icon: opts?.icon,
        tone: opts?.tone ?? 'default',
        buttons: [{ text: opts?.okText ?? 'Đồng ý', onPress: () => resolve() }],
      });
    });
  },
  confirm(o: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    icon?: IconName;
  }) {
    return new Promise<boolean>((resolve) => {
      show({
        title: o.title,
        message: o.message,
        icon: o.icon,
        tone: o.destructive ? 'danger' : 'default',
        buttons: [
          { text: o.cancelText ?? 'Huỷ', style: 'cancel', onPress: () => resolve(false) },
          {
            text: o.confirmText ?? 'Đồng ý',
            style: o.destructive ? 'destructive' : 'default',
            onPress: () => resolve(true),
          },
        ],
      });
    });
  },
};

/** Hỏi xác nhận đăng xuất, đồng ý thì chạy onConfirm */
export async function confirmLogout(onConfirm: () => void | Promise<void>) {
  const ok = await dialog.confirm({
    title: 'Đăng xuất?',
    message: 'Bạn có chắc muốn đăng xuất khỏi tài khoản này không?',
    confirmText: 'Đăng xuất',
    cancelText: 'Ở lại',
    destructive: true,
    icon: 'log-out-outline',
  });
  if (ok) await onConfirm();
}

/** Hỏi xác nhận thoát (bài học, màn hình đang làm dở...) */
export async function confirmExit(onConfirm: () => void, message = 'Tiến độ hiện tại sẽ không được lưu.') {
  const ok = await dialog.confirm({
    title: 'Thoát?',
    message,
    confirmText: 'Thoát',
    cancelText: 'Tiếp tục',
    destructive: true,
    icon: 'exit-outline',
  });
  if (ok) onConfirm();
}

/* ---------- Host: gắn 1 lần ở root layout ---------- */
export function DialogHost() {
  const [queue, setQueue] = useState<DialogOptions[]>([]);
  const anim = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  const cur = queue[0];

  useEffect(() => {
    push = (o) => setQueue((q) => [...q, o]);
    if (pending.length) setQueue((q) => [...q, ...pending.splice(0)]);
    return () => {
      push = null;
    };
  }, []);

  useEffect(() => {
    if (!cur) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 200, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start();
  }, [cur, anim]);

  function close(b?: DialogButton) {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(anim, { toValue: 0, duration: 130, useNativeDriver: true }).start(() => {
      closing.current = false;
      setQueue((q) => q.slice(1));
      b?.onPress?.();
    });
  }

  if (!cur) return null;

  const tone = TONES[cur.tone ?? 'default'];
  const row = cur.buttons.length === 2;
  const ordered = row ? [...cur.buttons].sort((a, b) => (a.style === 'cancel' ? -1 : b.style === 'cancel' ? 1 : 0)) : cur.buttons;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => {
      const cancel = cur.buttons.find((b) => b.style === 'cancel');
      if (cancel) close(cancel);
      else if (cur.buttons.length <= 1) close(cur.buttons[0]);
    }}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(20,16,50,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
          opacity: anim,
        }}
      >
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: '#fff',
            borderRadius: 28,
            paddingHorizontal: 22,
            paddingTop: 26,
            paddingBottom: 20,
            alignItems: 'center',
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
          }}
        >
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: tone.bg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Ionicons name={cur.icon ?? tone.icon} size={34} color={tone.fg} />
          </View>

          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' }}>{cur.title}</Text>
          {cur.message ? (
            <Text style={{ fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: 8 }}>
              {cur.message}
            </Text>
          ) : null}

          <View style={{ flexDirection: row ? 'row' : 'column', gap: 10, marginTop: 22, width: '100%' }}>
            {ordered.map((b, i) => {
              const cancel = b.style === 'cancel';
              const danger = b.style === 'destructive';
              const bg = cancel ? '#F1F0F8' : danger ? '#E5484D' : colors.primary;
              const fg = cancel ? colors.text : '#fff';
              return (
                <Pressable
                  key={i}
                  onPress={() => close(b)}
                  style={({ pressed }) => ({
                    flex: row ? 1 : undefined,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: fg, fontSize: 15, fontWeight: '800' }}>{b.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}