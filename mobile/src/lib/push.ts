import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from '../api/client';

const TOKEN_KEY = 'wordtopia_push_token';

type NotificationsModule = typeof import('expo-notifications');
let cached: NotificationsModule | null | undefined;

// Giống lib/reminder.ts: thiếu module native (Expo Go) thì trả null thay vì làm sập app.
function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  try {
    cached = require('expo-notifications') as NotificationsModule;
  } catch (e) {
    console.log('[push] expo-notifications không dùng được trong môi trường này', e);
    cached = null;
  }
  return cached;
}

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Hiện thông báo cả khi đang mở app. Gọi một lần khi vào app. */
export function initPush() {
  try {
    getNotifications()?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.log('[push] không đặt được handler', e);
  }
}

/** Lấy Expo push token và gửi lên server. ask=false: chỉ làm khi đã được cấp quyền (không hiện hộp xin quyền). */
export async function registerPush(opts: { ask?: boolean } = {}): Promise<string | null> {
  const N = getNotifications();
  if (!N || !Device.isDevice) return null;
  try {
    let { status } = await N.getPermissionsAsync();
    if (status !== 'granted') {
      if (!opts.ask) return null;
      status = (await N.requestPermissionsAsync()).status;
      if (status !== 'granted') return null;
    }
    const pid = projectId();
    if (!pid) {
      console.log('[push] thiếu EAS projectId (chạy `eas init` trong thư mục mobile)');
      return null;
    }
    if (Platform.OS === 'android') {
      try {
        await N.setNotificationChannelAsync('reminder', {
          name: 'Nhắc học hằng ngày',
          importance: N.AndroidImportance.DEFAULT,
          sound: 'default',
          lightColor: '#6C4CF1',
        });
      } catch {}
    }
    const { data: token } = await N.getExpoPushTokenAsync({ projectId: pid });
    await api.post('/devices', { token, platform: Platform.OS }, { timeout: 15000 });
    await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
    return token;
  } catch (e) {
    console.log('[push] đăng ký lỗi', e);
    return null;
  }
}

/** Gọi khi đăng xuất (lúc vẫn còn đăng nhập) để máy này không nhận thông báo của tài khoản cũ. */
export async function unregisterPush() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return;
    await api.post('/devices/unregister', { token }, { timeout: 4000 });
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
}

/** Đưa giờ nhắc lên server (null = tắt). Lỗi thì bỏ qua, nhắc local vẫn là dự phòng. */
export async function syncReminderHour(hour: number | null) {
  try {
    await api.patch('/devices/reminder', { hour }, { timeout: 8000 });
  } catch {}
}

/** Bật nhắc bằng push từ server; thành công thì hủy nhắc local để khỏi báo trùng. */
export async function preferServerReminder(hour: number): Promise<boolean> {
  const token = await registerPush({ ask: true });
  if (!token) return false;
  try {
    await api.patch('/devices/reminder', { hour }, { timeout: 8000 });
  } catch {
    return false;
  }
  try {
    await getNotifications()?.cancelAllScheduledNotificationsAsync();
  } catch {}
  return true;
}

/** Bấm vào thông báo thì mở màn hình trong data.screen. Trả về hàm hủy đăng ký. */
export function onNotificationTap(go: (screen: string) => void): () => void {
  const N = getNotifications();
  if (!N) return () => {};
  const sub = N.addNotificationResponseReceivedListener((r) => {
    const screen = r.notification.request.content.data?.screen;
    if (typeof screen === 'string') go(screen);
  });
  return () => sub.remove();
}
