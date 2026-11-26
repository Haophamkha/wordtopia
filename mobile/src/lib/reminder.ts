import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'wordtopia_reminder';

export interface ReminderSetting {
  enabled: boolean;
  hour: number;
}

type NotificationsModule = typeof import('expo-notifications');
let cached: NotificationsModule | null | undefined;

// Nạp expo-notifications khi cần. Thiếu module native (Expo Go) thì trả null thay vì làm sập app.
function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  try {
    cached = require('expo-notifications') as NotificationsModule;
  } catch (e) {
    console.log('[reminder] expo-notifications không dùng được trong môi trường này', e);
    cached = null;
  }
  return cached;
}

export function isReminderSupported(): boolean {
  return getNotifications() !== null;
}

export async function loadReminder(): Promise<ReminderSetting> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (raw) return JSON.parse(raw) as ReminderSetting;
  } catch {}
  return { enabled: false, hour: 20 };
}

async function persist(s: ReminderSetting) {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(s));
  } catch {}
}

/** Bật nhắc mỗi ngày lúc `hour`:00. Trả về false nếu không hỗ trợ hoặc người dùng từ chối quyền. */
export async function enableReminder(hour: number): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return false;

    // Tạo kênh có thể lỗi trong Expo Go: bỏ qua lỗi, dùng kênh mặc định.
    let channelOk = false;
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('reminder', {
          name: 'Nhắc học hằng ngày',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6C4CF1',
        });
        channelOk = true;
      } catch {}
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Đến giờ học từ vựng rồi! 📚', body: 'Dành vài phút ôn tập để giữ chuỗi ngày học nhé 🔥' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
        ...(channelOk ? { channelId: 'reminder' } : {}),
      },
    });
    await persist({ enabled: true, hour });
    return true;
  } catch (e) {
    console.log('[reminder] không đặt được nhắc nhở', e);
    return false;
  }
}

export async function disableReminder(hour: number) {
  const Notifications = getNotifications();
  try {
    await Notifications?.cancelAllScheduledNotificationsAsync();
  } catch {}
  await persist({ enabled: false, hour });
}