import { api } from './api.service';
import { API_ENDPOINTS } from './api.endpoints';

export interface Farm {
  id: string;
  name: string;
  location: string;
  healthPercentage: number;
  status: 'healthy' | 'warning' | 'critical';
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface WeatherData {
  temperature: number;
  location: string;
  condition: string;
  realFeel: number;
  date: string;
}

export const farmsService = {
  async getFarms(): Promise<Farm[]> {
    try {
      const response = await api.get('/farms');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch farms');
    }
  },

  async getFarmsByUser(userId: string): Promise<Farm[]> {
    try {
      const response = await api.get(`/users/${userId}/farms`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user farms');
    }
  },

  async getWeatherData(): Promise<WeatherData> {
    // Note: Weather data endpoint not provided in the API list
    // Using mock data for now - replace when weather endpoint is available
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          temperature: 20,
          location: 'Lima, Peru',
          condition: 'Partly Cloudy',
          realFeel: 19,
          date: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
        });
      }, 600);
    });
  },
};