import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoggingOut = useRef(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('vardhman_token');
    const savedUser = localStorage.getItem('vardhman_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('vardhman_token');
        localStorage.removeItem('vardhman_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        localStorage.setItem('vardhman_token', data.token);
        localStorage.setItem('vardhman_user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success(`Welcome back, ${data.user.name}! 👋`);
        return { success: true, role: data.user.role };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
      return { success: false };
    }
  }, []);

  const logout = useCallback(async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('vardhman_token');
    localStorage.removeItem('vardhman_user');
    setUser(null);
    toast.success('Logged out successfully.');
    window.location.href = '/login';
    isLoggingOut.current = false;
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('vardhman_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
