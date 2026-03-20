import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { findUser, createUser, updateUser, getUsers, seedIfEmpty } from '../lib/db';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Set API URL for online mode — Vite dev server proxies /api to port 3001
// This will work both from localhost and from network IP
if (typeof window !== 'undefined') {
  // Try to detect if running via network (not file://)
  const isNetwork = window.location.protocol === 'http:' || window.location.protocol === 'https:';
  if (isNetwork) {
    window.GH_API_URL = window.location.origin;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedIfEmpty();
    // Restore session from localStorage (just the ID, validate against API)
    const restore = async () => {
      try {
        const stored = localStorage.getItem('gh_session');
        if (stored) setUser(JSON.parse(stored));
      } catch {}
      setLoading(false);
    };
    restore();
  }, []);

  // Presence heartbeat
  useEffect(() => {
    if (!user) return;
    updateUser(user.id, { online: true, lastSeen: Date.now() });
    const interval = setInterval(() => {
      updateUser(user.id, { lastSeen: Date.now() });
    }, 30000);
    return () => {
      clearInterval(interval);
      updateUser(user.id, { online: false });
    };
  }, [user?.id]);

  const login = useCallback(async (username, password) => {
    const found = await findUser(username);
    if (!found) throw new Error('Kullanıcı bulunamadı');
    if (found.password !== password) throw new Error('Şifre hatalı');
    const session = { ...found };
    setUser(session);
    localStorage.setItem('gh_session', JSON.stringify(session));
    return session;
  }, []);

  const register = useCallback(async (data) => {
    const { password, passwordConfirm, ...rest } = data;
    if (password !== passwordConfirm) throw new Error('Şifreler eşleşmiyor');
    if (password.length < 4) throw new Error('Şifre en az 4 karakter olmalı');
    const newUser = await createUser({ ...rest, password });
    setUser(newUser);
    localStorage.setItem('gh_session', JSON.stringify(newUser));
    return newUser;
  }, []);

  const logout = useCallback(() => {
    if (user) updateUser(user.id, { online: false });
    setUser(null);
    localStorage.removeItem('gh_session');
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const all = await getUsers();
    const updated = all.find(u => u.id === user.id);
    if (updated) {
      setUser(updated);
      localStorage.setItem('gh_session', JSON.stringify(updated));
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};
