import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

const SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL;

interface User {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('project-aar-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ op: 'verifyUserByEmail', payload: { email } }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        const userData: User = result.data;
        setUser(userData);
        localStorage.setItem('project-aar-user', JSON.stringify(userData));
      } else {
        throw new Error(result.message || 'User not authorized or not found.');
      }
    } catch (error) {
      console.error("Login failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('project-aar-user');
  };

  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

