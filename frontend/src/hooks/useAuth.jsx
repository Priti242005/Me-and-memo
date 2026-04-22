/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { login, register } from '../services/authService';
import { getMe } from '../services/userService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getStoredToken()));
  const [authError, setAuthError] = useState(null);
  const hydratedOnMount = useRef(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const hydrateAuth = useCallback(
    async (nextToken) => {
      if (!nextToken) {
        clearSession();
        setLoading(false);
        return null;
      }

      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
      setLoading(true);
      setAuthError(null);

      try {
        const payload = await getMe();
        const nextUser = payload.user || payload;
        setUser(nextUser);
        return nextUser;
      } catch (error) {
        clearSession();
        setAuthError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearSession]
  );

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      clearSession();
      setLoading(false);
      return null;
    }

    return hydrateAuth(storedToken);
  }, [clearSession, hydrateAuth]);

  useEffect(() => {
    if (hydratedOnMount.current) return;
    hydratedOnMount.current = true;

    if (!token) {
      setLoading(false);
      return;
    }

    refreshUser().catch(() => {});
  }, [token, refreshUser]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      authError,

      login: async (payload) => {
        setAuthError(null);
        const res = await login(payload);
        await hydrateAuth(res.token);
        return res;
      },

      register: async (payload) => {
        setAuthError(null);
        const res = await register(payload);
        await hydrateAuth(res.token);
        return res;
      },

      setTokenDirect: async (newToken) => hydrateAuth(newToken),

      logout: () => {
        clearSession();
        setLoading(false);
      },

      refreshUser,
      setAuthError,
    }),
    [token, user, loading, authError, hydrateAuth, clearSession, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
