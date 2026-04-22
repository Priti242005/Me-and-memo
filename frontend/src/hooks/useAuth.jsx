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
  const inFlightRef = useRef(null);
  const inFlightTokenRef = useRef(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    inFlightRef.current = null;
    inFlightTokenRef.current = null;
  }, []);

  const refreshUser = useCallback(
    async (overrideToken) => {
      const activeToken = overrideToken || localStorage.getItem(TOKEN_KEY);

      if (!activeToken) {
        clearSession();
        setLoading(false);
        return null;
      }

      if (inFlightRef.current && inFlightTokenRef.current === activeToken) {
        return inFlightRef.current;
      }

      setLoading(true);
      setAuthError(null);
      inFlightTokenRef.current = activeToken;

      const request = getMe()
        .then((payload) => {
          const nextUser = payload.user || payload;
          setUser(nextUser);
          setToken(activeToken);
          return nextUser;
        })
        .catch((error) => {
          clearSession();
          setAuthError(error);
          throw error;
        })
        .finally(() => {
          if (inFlightRef.current === request) {
            inFlightRef.current = null;
            inFlightTokenRef.current = null;
          }
          setLoading(false);
        });

      inFlightRef.current = request;
      return request;
    },
    [clearSession]
  );

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    refreshUser(token).catch(() => {});
  }, [token, refreshUser]);

  const setTokenDirect = useCallback((newToken) => {
    if (!newToken) {
      clearSession();
      setLoading(false);
      return;
    }

    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(null);
    setAuthError(null);
    setLoading(true);
  }, [clearSession]);

  const login = useCallback(
    async (payload) => {
      setAuthError(null);
      const res = await loginRequest(payload);
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(null);
      await refreshUser(res.token);
      return res;
    },
    [refreshUser]
  );

  const register = useCallback(
    async (payload) => {
      setAuthError(null);
      const res = await registerRequest(payload);
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(null);
      await refreshUser(res.token);
      return res;
    },
    [refreshUser]
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
