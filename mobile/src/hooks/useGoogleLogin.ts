import { useState } from 'react';
import { authApi } from '../api/auth';
import { errorMessage } from '../api/client';
import { GoogleError, signInWithGoogle } from '../lib/google';
import { useAuthStore } from '../store/auth';

export function useGoogleLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return;
      const res = await authApi.google(idToken);
      await setSession(res.accessToken, res.user);
    } catch (e) {
      setError(e instanceof GoogleError ? e.message : errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return { run, loading, error };
}