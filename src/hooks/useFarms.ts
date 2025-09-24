import { useCallback } from 'react';
import { api } from '../services/api.service';
import { useFarmsEndpoint } from './useFarmsEndpoint';

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

/**
 * Hook personalizado para manejar operaciones de farms con endpoints dinámicos
 * basados en el rol del usuario
 */
export const useFarms = () => {
  const { getFarmsEndpoint, isManager } = useFarmsEndpoint();

  const getFarms = useCallback(async (): Promise<Farm[]> => {
    try {
      const endpoint = getFarmsEndpoint();
      const response = await api.get(endpoint);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch farms');
    }
  }, [getFarmsEndpoint]);

  const getFarmsByUser = useCallback(async (userId: string): Promise<Farm[]> => {
    try {
      const response = await api.get(`/users/${userId}/farms`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user farms');
    }
  }, []);

  const getFarmSections = useCallback(async (farmId: string): Promise<Section[]> => {
    try {
      const response = await api.get(`/farms/${farmId}/sections`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch farm sections');
    }
  }, []);

  const getWeatherData = useCallback(async (): Promise<WeatherData> => {
    // Use the farms service which now connects to OpenWeatherMap API
    const { farmsService } = await import('../services/farms.service');
    return await farmsService.getWeatherData();
  }, []);

  const createSection = useCallback(async (
    farmId: string, 
    data: { 
      name: string; 
      growthStage: 'plantula' | 'vegetativo' | 'floracion' | 'fructificacion' | 'maduracion' | 'cosecha' 
    }
  ): Promise<Section> => {
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
  }, []);

  return {
    getFarms,
    getFarmsByUser,
    getFarmSections,
    getWeatherData,
    createSection,
    isManager,
  };
};