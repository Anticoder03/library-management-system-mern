import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('sl_user') || 'null');
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('sl_token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('sl_token')));

  const persist = useCallback((nextUser, nextToken) => {
    localStorage.setItem('sl_token', nextToken);
    localStorage.setItem('sl_user', JSON.stringify(nextUser));
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const data = await api.post('/auth/login', credentials);
      persist(data.data.user, data.data.token);
      return data.data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const data = await api.post('/auth/register', payload);
      persist(data.data.user, data.data.token);
      return data.data.user;
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('sl_token');
    localStorage.removeItem('sl_user');
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((current) => {
      const next = { ...current, ...updates };
      localStorage.setItem('sl_user', JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleExternalLogout = () => logout();
    window.addEventListener('auth:logout', handleExternalLogout);
    return () => window.removeEventListener('auth:logout', handleExternalLogout);
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    api
      .get('/auth/me')
      .then((data) => {
        if (active) {
          setUser(data.data.user);
          localStorage.setItem('sl_user', JSON.stringify(data.data.user));
        }
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token, logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAdmin: user?.role === 'admin',
      isStaff: user?.role === 'admin' || user?.role === 'librarian',
      isMember: user?.role === 'member',
    }),
    [user, token, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
