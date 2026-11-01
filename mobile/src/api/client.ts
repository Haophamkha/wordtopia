import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth';

// Ưu tiên EXPO_PUBLIC_API_URL (khi đã deploy). Mặc định: IP máy tính chạy Expo + cổng 3000
export function resolveBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:3000`;
}

export const api = axios.create({ baseURL: resolveBaseUrl(), timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  },
);

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const m = err.response?.data?.message;
    if (Array.isArray(m)) return m.join('\n');
    if (typeof m === 'string') return m;
    if (!err.response) return 'Không kết nối được máy chủ. Kiểm tra WiFi và backend.';
  }
  return 'Có lỗi xảy ra, thử lại sau.';
}