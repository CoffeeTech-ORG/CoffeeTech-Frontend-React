import { api } from './api.service';

interface Role {
  id: number;
  name: string;
}

interface LoginResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  token: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  rolId: number;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post('/authentication/sign-in', { email, password });
      // The backend already responds in the right shape:
      // { "id": 1, "username": "diego", "email": "diego@coffeetech.com", "token": "eyJh..." }
      const loginResponse: LoginResponse = {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role,
        token: response.data.token
      };
      
      return loginResponse;
    } catch (error: any) {
      console.error('AuthService: Login error:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response = await api.post('/authentication/sign-up', userData);
      
      // Assume register returns the same shape too.
      const registerResponse: LoginResponse = {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role,
        token: response.data.token
      };
      
      return registerResponse;
    } catch (error: any) {
      // Re-throw the full error so the component can access response.data.
      throw error;
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