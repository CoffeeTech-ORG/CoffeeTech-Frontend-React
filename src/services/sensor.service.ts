/**
 * The Hub inventory.
 *
 * Points at `/devices` because `/sensors` no longer exists: `Sensor` and `Device` were the same hub in
 * two tables and were merged into `devices`. See `merge_sensors_into_devices.sql` in the backend.
 *
 * The view is READ-ONLY by design: hubs register themselves on their first report
 * (`POST /devices/report`, called by the Raspberry Pi). There is no `createSensor`, `updateSensor` or
 * `deleteSensor` -- the backend never had `PUT` or `DELETE` routes for them.
 *
 * The only thing operable from the interface is which section each hub is assigned to, and that lives
 * in the assignments flow.
 */
import { Sensor } from '../types/sensor.types';
import { fetchWithAuth } from './api.client';

const API_BASE_URL = import.meta.env.VITE_BACKEND_SERVICE_URL;
const DEVICES_API_BASE = `${API_BASE_URL}/devices`;

export class SensorService {
  private static instance: SensorService;

  static getInstance(): SensorService {
    if (!SensorService.instance) {
      SensorService.instance = new SensorService();
    }
    return SensorService.instance;
  }

  async getAllSensors(): Promise<Sensor[]> {
    try {
      return await fetchWithAuth(DEVICES_API_BASE);
    } catch (error) {
      console.error('Error al cargar los hubs:', error);
      throw error;
    }
  }

  async getSensorById(id: number): Promise<Sensor> {
    try {
      return await fetchWithAuth(`${DEVICES_API_BASE}/${id}`);
    } catch (error) {
      console.error('Error al cargar el hub:', error);
      throw error;
    }
  }
}

export const sensorService = SensorService.getInstance();
