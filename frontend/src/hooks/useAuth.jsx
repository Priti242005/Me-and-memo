/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login, register } from '../services/authService';
import { getMe } from '../services/userService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);
      const payload = await getMe();
      // API returns { user: {...} }
      setUser(payload.user || payload);
    } catch {
      // Token is likely invalid/expired.
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      authError,
      login: async (payload) => {
        setAuthError(null);
        const res = await login(payload);
        localStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
        return res;
      },
      register: async (payload) => {
        setAuthError(null);
        const res = await register(payload);
        localStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
        return res;
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
      refreshUser: loadUser,
      setAuthError,
    }),
    [token, user, loading, authError, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

