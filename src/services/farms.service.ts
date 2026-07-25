import { api } from './api.service';
import { ringToGeoJsonString } from '../utils/geoBoundary';

/**
 * How the farm's coordinate was obtained. Coffee farms rarely have a postal address: a search
 * reaches the district at best, which can be kilometres from the plot. `APPROXIMATE` is enough for
 * weather (the grids do not resolve those kilometres) but not for the map, which must warn.
 */
export type LocationPrecision = 'NONE' | 'APPROXIMATE' | 'EXACT';

export interface Farm {
  id: string;
  name: string;
  location: string;
  /**
   * Metres above sea level, or `null` while unrecorded. Do NOT substitute 0: the engine picks an
   * ALTITUDE BAND from this number, and 0 falls in the low band, the maximum-weight profile for
   * rust and borer. With null the engine does not modulate and says so. Same as `latitude`.
   */
  altitude: number | null;
  /**
   * `null` means "where it is is not known yet". Do not substitute a default: an invented
   * coordinate shows as convincingly as a real one.
   */
  latitude: number | null;
  longitude: number | null;
  locationPrecision: LocationPrecision;
  /**
   * Farm boundary as `[lat, lng]` vertices; `null` until drawn. Stored as GeoJSON on the backend
   * (`[lng, lat]`, reversed), handled in Leaflet's order here. The area in hectares comes from it,
   * which turns the engine's kg/ha advice into a concrete amount.
   */
  boundary: [number, number][] | null;
}

/*
 * The backend contract is (Id, Name, Location, Altitude); it returns no health, status or
 * coordinates field, so the type does not declare them.
 */

/**
 * A period during which a hub was installed in a section. Null `removedAt` = open period, the hub
 * is still there. Moving a hub does not rewrite the row: it closes the period and opens another,
 * so earlier readings keep belonging to the plot they were taken in.
 */
export interface Assignment {
  id: number;
  sectionId: number;
  deviceId: number;
  installedAt: string;
  removedAt: string | null;
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
  updatedAt?: string; // New field from API
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Device {
  id: number;
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

  async updateFarm(
    id: number,
    data: {
      name: string;
      location: string;
      altitude: number | null;
      latitude?: number | null;
      longitude?: number | null;
      locationPrecision?: LocationPrecision;
      boundary?: [number, number][] | null;
    }
  ): Promise<Farm> {
    try {
      const response = await api.put(`/farms/${id}`, {
        id: id,
        name: data.name,
        location: data.location,
        altitude: data.altitude,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        locationPrecision: data.locationPrecision ?? 'NONE',
        // GeoJSON as text, or null if there is no boundary yet.
        boundary: ringToGeoJsonString(data.boundary)
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

  /**
   * Closes an assignment's period: the hub stops measuring that section from now. Does NOT delete
   * the row -- the backend marks it with `removedAt` so that period's readings keep belonging to
   * this section; deleting it would orphan them in the reports.
   */
  async removeAssignment(assignmentId: number): Promise<void> {
    try {
      await api.delete(`/assignments/${assignmentId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'No se pudo quitar el hub');
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

  /**
   * Every hub's install periods. The backend takes no per-device filter (`GET /assignments` and
   * nothing more), so a hub's history is sliced client-side. At install scale -- a table that grows
   * a row each time equipment is moved -- that is negligible; if it stops being so, the filter
   * belongs in `AssignmentsController`, not here.
   */
  async listAssignments(): Promise<Assignment[]> {
    try {
      const response = await api.get('/assignments');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'No se pudo cargar el historial');
    }
  },

  /** Every farm's sections. Used by the "assign to a section" picker. */
  async listAllSections(): Promise<Section[]> {
    try {
      const response = await api.get('/sections');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'No se pudieron cargar las secciones');
    }
  },
};