import { api } from './api.service';

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

export interface Section {
  id: string;
  name: string;
  farmId: string;
  type: string; // Backend returns "Plántula", "Floración", etc.
  growthStage?: 'plantula' | 'vegetativo' | 'floracion' | 'fructificacion' | 'maduracion' | 'cosecha'; // Optional for backwards compatibility
  size: number; // in hectares or area unit
  healthPercentage: number;
  status: 'healthy' | 'warning' | 'critical';
  lastUpdate: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
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

  async getFarmSections(farmId: string): Promise<Section[]> {
    try {
      const response = await api.get(`/farms/${farmId}/sections`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch farm sections');
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

  async updateFarm(id: number, data: { name: string; location: string }): Promise<Farm> {
    try {
      const response = await api.put(`/farms/${id}`, {
        id: id,
        name: data.name,
        location: data.location
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update farm');
    }
  },

  async deleteFarm(id: number): Promise<void> {
    try {
      await api.delete(`/farms/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete farm');
    }
  },

  async updateSection(id: number, data: { name: string; type: string }): Promise<Section> {
    try {
      const response = await api.put(`/sections/${id}`, {
        id: id,
        name: data.name,
        type: data.type
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update section');
    }
  },

  async deleteSection(id: number): Promise<void> {
    try {
      await api.delete(`/sections/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete section');
    }
  },

  async createSection(farmId: string, data: { name: string; growthStage: 'plantula' | 'vegetativo' | 'floracion' | 'fructificacion' | 'maduracion' | 'cosecha' }): Promise<Section> {
    try {
      // Map growth stage to display name
      const growthStageDisplayNames: Record<string, string> = {
        plantula: 'Plántula',
        vegetativo: 'Vegetativo',
        floracion: 'Floración',
        fructificacion: 'Fructificación',
        maduracion: 'Maduración',
        cosecha: 'Cosecha'
      };

      const response = await api.post('/sections', {
        name: data.name,
        type: growthStageDisplayNames[data.growthStage],
        farmId: farmId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create section');
    }
  },
};