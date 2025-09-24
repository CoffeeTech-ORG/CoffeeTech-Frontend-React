import { api } from './api.service';
import { weatherService } from './weather.service';

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
  cityName: string;
  temperature: number;
  mainCondition: string;
  realFeel: number;
  date: string;
  location: string;
  condition: string;
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

export interface Device {
  id: number;
  dataRecordId: number;
  deviceHubId: string;
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
    try {
      // Usar el servicio de clima real que consume la API de OpenWeatherMap
      return await weatherService.getCurrentWeather();
    } catch (error) {
      console.error('Error fetching weather data, falling back to mock data:', error);
      // Fallback a datos mock si falla la API
      return {
        cityName: 'Lima',
        temperature: 20,
        mainCondition: 'Clouds',
        location: 'Lima, Peru',
        condition: 'Partly Cloudy',
        realFeel: 19,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
      };
    }
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

  async getDevices(): Promise<Device[]> {
    try {
      const response = await api.get('/devices');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch devices');
    }
  },

  async createDevice(deviceHubId: string): Promise<Device> {
    try {
      // First, check if the device with this MAC address already exists
      const existingDevices = await this.getDevices();
      const deviceExists = existingDevices.some(device => 
        device.deviceHubId === deviceHubId
      );

      if (deviceExists) {
        throw new Error('A device with this MAC address already exists');
      }

      const response = await api.post('/devices', {
        dataRecordId: 0,
        deviceHubId: deviceHubId
      });
      return response.data;
    } catch (error: any) {
      // If it's our custom duplicate error, re-throw it as is
      if (error.message === 'A device with this MAC address already exists') {
        throw error;
      }
      // Otherwise, use the generic error handling
      throw new Error(error.response?.data?.message || 'Failed to create device');
    }
  },

  async createAssignment(sectionId: number, deviceId: number): Promise<any> {
    try {
      const response = await api.post('/assignments', {
        sectionId: sectionId,
        deviceId: deviceId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create assignment');
    }
  },
};