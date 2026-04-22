/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { login as loginRequest, register as registerRequest } from '../services/authService';
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

    setLoading(true);
    setAuthError(null);

    try {
      const payload = await getMe();
      const nextUser = payload.user || payload;
      setUser(nextUser);
      setToken(storedToken);
      return nextUser;
    } catch (error) {
      clearSession();
      setAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    if (hydratedOnMount.current) return;
    hydratedOnMount.current = true;

    if (!token) {
      setLoading(false);
      return;
    }

    refreshUser().catch(() => {});
  }, [token, refreshUser]);

  const login = useCallback(
    async (payload) => {
      setAuthError(null);
      const res = await loginRequest(payload);
      await hydrateAuth(res.token);
      return res;
    },
    [hydrateAuth]
  );

  const register = useCallback(
    async (payload) => {
      setAuthError(null);
      const res = await registerRequest(payload);
      await hydrateAuth(res.token);
      return res;
    },
    [hydrateAuth]
  );

  const setTokenDirect = useCallback(
    async (newToken) => hydrateAuth(newToken),
    [hydrateAuth]
  );

  const logout = useCallback(() => {
    clearSession();
    setLoading(false);
  }, [clearSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      authError,
      login,
      register,
      setTokenDirect,
      logout,
      refreshUser,
      setAuthError,
    }),
    [token, user, loading, authError, login, register, setTokenDirect, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
