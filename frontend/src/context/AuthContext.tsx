import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('securemed_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('securemed_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('securemed_token');
    if (!currentToken) {
      setUser(null);
      return;
    }
    try {
      const profile = await api.getMe(currentToken);
      setUser(profile);
      localStorage.setItem('securemed_user', JSON.stringify(profile));
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('securemed_token');
      if (storedToken) {
        try {
          const profile = await api.getMe(storedToken);
          setUser(profile);
          localStorage.setItem('securemed_user', JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('securemed_token', newToken);
    localStorage.setItem('securemed_user', JSON.stringify(newUser));
  };

  const logout = () => {
    api.logout().catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem('securemed_token');
    localStorage.removeItem('securemed_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
