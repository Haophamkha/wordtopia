import type { AuthResponse } from '../types';
import { api } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<AuthResponse>("/auth/login", { email, password })
      .then((r) => r.data),
  register: (name: string, email: string, password: string) =>
    api
      .post<AuthResponse>("/auth/register", { name, email, password })
      .then((r) => r.data),
  google: (idToken: string) =>
    api.post<AuthResponse>("/auth/google", { idToken }).then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (email: string, code: string, newPassword: string) =>
    api
      .post("/auth/reset-password", { email, code, newPassword })
      .then((r) => r.data),
};