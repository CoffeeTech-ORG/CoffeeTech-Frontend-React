import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';

interface User {
  id: number;
  username: string;
  email: string;
}

interface LoginResponse {
  id: number;
  username: string;
  email: string;
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

  // Función para guardar auth data en localStorage y state
  const login = (data: LoginResponse) => {
    const authData = {
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
      },
      token: data.token,
    };
    
    // Guardar en localStorage
    localStorage.setItem('auth', JSON.stringify(authData));
    
    // Actualizar state
    setUser(authData.user);
    setToken(authData.token);
  };

  // Función para login con credenciales (llama al backend)
  const loginWithCredentials = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);

      // Usar la función login para guardar los datos
      login(response); // La respuesta ya tiene el formato correcto
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authService.register(userData);
      
      // Usar la función login para guardar los datos
      login(response); // La respuesta ya tiene el formato correcto
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem('auth');
    localStorage.removeItem('token'); // Por si acaso queda el token viejo
    
    // Limpiar state
    setUser(null);
    setToken(null);
  };

  // Restaurar sesión al cargar la aplicación
  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        if (parsedAuth.user && parsedAuth.token) {
          setUser(parsedAuth.user);
          setToken(parsedAuth.token);
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