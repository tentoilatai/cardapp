import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (username: string, password: string, fullName?: string) => Promise<User>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const currentUser = await api.get<User>('/api/auth/me');
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
      queryClient.clear();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [queryClient]);

  const login = async (username: string, password: string): Promise<User> => {
    const loggedUser = await api.post<User>('/api/auth/login', { username, password });
    setUser(loggedUser);
    queryClient.clear();
    return loggedUser;
  };

  const register = async (username: string, password: string, fullName?: string): Promise<User> => {
    const newUser = await api.post<User>('/api/auth/register', { username, password, fullName });
    setUser(newUser);
    queryClient.clear();
    return newUser;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
      queryClient.clear();
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword?: string) => {
    await api.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword: confirmPassword || newPassword
    });
    if (user) {
      setUser({ ...user, mustChangePassword: false });
    }
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        mustChangePassword: !!user?.mustChangePassword,
        login,
        register,
        logout,
        changePassword,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
