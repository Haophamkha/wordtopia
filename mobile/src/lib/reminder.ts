import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'wordtopia_reminder';

export interface ReminderSetting {
  enabled: boolean;
  hour: number;
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

/** Bật nhắc mỗi ngày lúc `hour`:00. Trả về false nếu người dùng từ chối quyền. */
export async function enableReminder(hour: number): Promise<boolean> {
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
}

export async function disableReminder(hour: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await persist({ enabled: false, hour });
}