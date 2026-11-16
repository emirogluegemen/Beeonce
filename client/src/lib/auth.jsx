import { createContext, useContext, useEffect, useState } from 'react';
import { request } from './api';
const AuthContext = createContext(null);
const KEY = 'seng383-demo-token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restore() {
      if (!token) { if (active) { setUser(null); setLoading(false); } return; }
      try {
        const data = await request('/auth/me', { token });
        if (active) { setUser(data.user); setLoading(false); }
      } catch {
        localStorage.removeItem(KEY);
        if (active) { setToken(null); setUser(null); setLoading(false); }
      }
    }
    restore();
    return () => { active = false; };
  }, [token]);

  const login = async (email, password) => {
    const data = await request('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem(KEY, data.token);
    setUser(data.user);
    setToken(data.token);
    setLoading(false);
    return data.user;
  };
  const logout = () => {
    localStorage.removeItem(KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  };
  return <AuthContext.Provider value={{ token, user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
export const homeForRole = role => role === 'parent' ? '/parent' : role === 'specialist' ? '/specialist' : '/child';
