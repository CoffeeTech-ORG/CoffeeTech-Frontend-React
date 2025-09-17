import { api } from './api.service';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
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
      
      // Transform API response to match our LoginResponse interface
      const apiData = response.data;
      const transformedResponse: LoginResponse = {
        token: apiData.token,
        user: {
          id: apiData.id.toString(), // Convert to string as expected by interface
          username: apiData.username,
          email: apiData.email
        }
      };
      
      console.log('AuthService: Transformed response:', transformedResponse);
      return transformedResponse;
    } catch (error: any) {
      console.error('AuthService: Login error:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response = await api.post('/authentication/sign-up', userData);
      console.log('AuthService: Register API response:', response.data);
      
      // Transform API response to match our LoginResponse interface
      const apiData = response.data;
      const transformedResponse: LoginResponse = {
        token: apiData.token,
        user: {
          id: apiData.id.toString(),
          username: apiData.username,
          email: apiData.email
        }
      };
      
      return transformedResponse;
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