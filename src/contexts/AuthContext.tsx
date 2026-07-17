import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { setAuthToken } from '../services/api.client';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
}

interface LoginResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  token: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginResponse) => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  rolId: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Persists the session (localStorage + axios header + state) from a login response.
  const login = (data: LoginResponse) => {
    const authData = {
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
      },
      token: data.token,
    };

    localStorage.setItem('auth', JSON.stringify(authData));
    setAuthToken(data.token);
    setUser(authData.user);
    setToken(authData.token);
  };

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      login(response);
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authService.register(userData);
      login(response);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('token'); // in case an old token key is still around
    setAuthToken(null);
    setUser(null);
    setToken(null);
  };

  // Restore the session on app load.
  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        if (parsedAuth.user && parsedAuth.token) {
          setUser(parsedAuth.user);
          setToken(parsedAuth.token);
          setAuthToken(parsedAuth.token);
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
        localStorage.removeItem('auth');
      }
    }
    setIsLoading(false);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    loginWithCredentials,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};