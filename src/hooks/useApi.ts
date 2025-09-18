import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://coffeetech-netcoreappweb-f6hwc3fph9hndhhg.centralus-01.azurewebsites.net/api/v1';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export const useApi = () => {
  const { token, logout } = useAuth();

  const request = useCallback(async <T = any>(
    config: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      // Crear instancia de axios con configuración base
      const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      });

      // Agregar token de autorización si está disponible
      if (token) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      // Interceptor para manejar errores 401 (token expirado)
      axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            logout(); // Limpiar sesión si el token es inválido
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );

      const response: AxiosResponse<T> = await axiosInstance(config);

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'API request failed');
    }
  }, [token, logout]);

  // Métodos de conveniencia
  const get = useCallback(<T = any>(url: string, config?: AxiosRequestConfig) => 
    request<T>({ ...config, method: 'GET', url }), [request]);

  const post = useCallback(<T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request<T>({ ...config, method: 'POST', url, data }), [request]);

  const put = useCallback(<T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request<T>({ ...config, method: 'PUT', url, data }), [request]);

  const patch = useCallback(<T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request<T>({ ...config, method: 'PATCH', url, data }), [request]);

  const del = useCallback(<T = any>(url: string, config?: AxiosRequestConfig) => 
    request<T>({ ...config, method: 'DELETE', url }), [request]);

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    isAuthenticated: !!token,
  };
};

// Hook de ejemplo de uso
export const useApiExample = () => {
  const api = useApi();

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }, [api]);

  const updateUserProfile = useCallback(async (profileData: any) => {
    try {
      const response = await api.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }, [api]);

  return {
    fetchUserProfile,
    updateUserProfile,
  };
};