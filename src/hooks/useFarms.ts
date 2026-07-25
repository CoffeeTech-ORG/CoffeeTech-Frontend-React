import { useCallback } from 'react';
import { api } from '../services/api.service';
import { useFarmsEndpoint } from './useFarmsEndpoint';

/*
 * These types re-export the single definition in `farms.service` instead of duplicating it here word
 * for word. Two definitions of the same concept mean fixing one leaves the other lying: adding
 * coordinates to `Farm` had TypeScript flag the Dashboard mixing both.
 */
import type { Farm, Section, LocationPrecision } from '../services/farms.service';
import { geoJsonToRing } from '../utils/geoBoundary';

export type { Farm, Section, LocationPrecision };

/**
 * The backend sends `id` as a number; the app-wide `Farm` type declares it `string`, and 52 places
 * treat it as such (`parseInt(farm.id, 10)`, React keys, comparisons).
 *
 * Normalising here, at the boundary, keeps the declared type from lying. Without it, `f.id ===
 * idFromUrl` is `2 === '2'` -> false: what broke the weather's farm selector, which always fell back
 * to the first, and what would break routing, since URL params are always text.
 */
const normalizeFarm = (raw: any): Farm => ({
  ...raw,
  id: String(raw.id),
  // The backend sends it as GeoJSON (text or object); the app wants it as `[lat, lng]`.
  boundary: geoJsonToRing(raw.boundary)
});
const normalizeSection = (raw: any): Section => ({
  ...raw,
  id: String(raw.id),
  farmId: String(raw.farmId)
});


/**
 * Handles farm operations against endpoints that depend on the user's role.
 */
export const useFarms = () => {
  const { getFarmsEndpoint, isManager } = useFarmsEndpoint();

  const getFarms = useCallback(async (): Promise<Farm[]> => {
    try {
      const endpoint = getFarmsEndpoint();
      const response = await api.get(endpoint);
      return (response.data || []).map(normalizeFarm);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch farms');
    }
  }, [getFarmsEndpoint]);

  const getFarmsByUser = useCallback(async (userId: string): Promise<Farm[]> => {
    try {
      const response = await api.get(`/users/${userId}/farms`);
      return (response.data || []).map(normalizeFarm);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user farms');
    }
  }, []);

  const getFarmSections = useCallback(async (farmId: string): Promise<Section[]> => {
    try {
      const response = await api.get(`/farms/${farmId}/sections`);
      return (response.data || []).map(normalizeSection);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch farm sections');
    }
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
    createSection,
    isManager,
  };
};