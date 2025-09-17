import { api } from './api.service';

interface LoginResponse {
  id: number;
  username: string;
  email: string;
  token: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('AuthService: Making login request...');
      const response = await api.post('/authentication/sign-in', { email, password });
      console.log('AuthService: API response:', response.data);
      
      // El backend ya responde con el formato correcto:
      // { "id": 1, "username": "diego", "email": "diego@coffeetech.com", "token": "eyJh..." }
      const loginResponse: LoginResponse = {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        token: response.data.token
      };
      
      console.log('AuthService: Login response:', loginResponse);
      return loginResponse;
    } catch (error: any) {
      console.error('AuthService: Login error:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response = await api.post('/authentication/sign-up', userData);
      console.log('AuthService: Register API response:', response.data);
      
      // Asumir que el register también devuelve el mismo formato
      const registerResponse: LoginResponse = {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        token: response.data.token
      };
      
      return registerResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  async validateToken(token: string) {
    try {
      const response = await api.get('/authentication', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Token validation failed');
    }
  },
};