import { Sensor, SensorFormData } from '../types/sensor.types';
import { fetchWithAuth } from './api.client';

const API_BASE_URL = import.meta.env.VITE_BACKEND_SERVICE_URL;
const SENSORS_API_BASE = `${API_BASE_URL}/sensors`;

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
      console.log('Fetching sensors from:', SENSORS_API_BASE);
      const sensors: Sensor[] = await fetchWithAuth(SENSORS_API_BASE);
      console.log('Sensors fetched successfully:', sensors);
      return sensors;
    } catch (error) {
      console.error('Error fetching sensors:', error);
      throw error;
    }
  }

  async getSensorById(id: number): Promise<Sensor> {
    try {
      const sensor: Sensor = await fetchWithAuth(`${SENSORS_API_BASE}/${id}`);
      return sensor;
    } catch (error) {
      console.error('Error fetching sensor:', error);
      throw error;
    }
  }

  async createSensor(sensorData: SensorFormData): Promise<Sensor> {
    try {
      const sensor: Sensor = await fetchWithAuth(SENSORS_API_BASE, {
        method: 'POST',
        body: JSON.stringify(sensorData),
      });
      return sensor;
    } catch (error) {
      console.error('Error creating sensor:', error);
      throw error;
    }
  }

  async updateSensor(id: number, sensorData: Partial<SensorFormData>): Promise<Sensor> {
    try {
      const sensor: Sensor = await fetchWithAuth(`${SENSORS_API_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(sensorData),
      });
      return sensor;
    } catch (error) {
      console.error('Error updating sensor:', error);
      throw error;
    }
  }

  async deleteSensor(id: number): Promise<void> {
    try {
      await fetchWithAuth(`${SENSORS_API_BASE}/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting sensor:', error);
      throw error;
    }
  }
}

export const sensorService = SensorService.getInstance();