import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { User } from '../types';

const KEY = 'wordtopia_session';

interface AuthState {
  token: string | null;
  user: User | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  patchUser: (patch: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  ready: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) {
        const { token, user } = JSON.parse(raw) as { token: string; user: User };
        set({ token, user, ready: true });
        return;
      }
    } catch {}
    set({ ready: true });
  },

  setSession: async (token, user) => {
    set({ token, user });
    try {
      await SecureStore.setItemAsync(KEY, JSON.stringify({ token, user }));
    } catch {}
  },

  patchUser: async (patch) => {
    const { token, user } = get();
    if (!token || !user) return;
    const next = { ...user, ...patch };
    set({ user: next });
    try {
      await SecureStore.setItemAsync(KEY, JSON.stringify({ token, user: next }));
    } catch {}
  },

  logout: async () => {
    set({ token: null, user: null });
    try {
      await SecureStore.deleteItemAsync(KEY);
    } catch {}
  },
}));