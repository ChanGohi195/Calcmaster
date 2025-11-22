import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (nickname: string, pin: string) => Promise<{ error: string | null }>;
  register: (nickname: string, pin: string) => Promise<{ error: string | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期化時に保存されたユーザー情報を読み込む
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (nickname: string, pin: string) => {
    const { user: loggedInUser, error } = await loginUser(nickname, pin);
    if (loggedInUser) {
      setUser(loggedInUser);
    }
    return { error };
  };

  const register = async (nickname: string, pin: string) => {
    const { user: newUser, error } = await registerUser(nickname, pin);
    if (newUser) {
      setUser(newUser);
    }
    return { error };
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
