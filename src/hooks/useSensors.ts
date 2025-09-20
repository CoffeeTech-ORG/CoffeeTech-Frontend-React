import { useState, useEffect, useCallback } from 'react';
import { Sensor, SensorFormData, SensorFilters, SensorStats } from '../types/sensor.types';
import { sensorService } from '../services/sensor.service';
import { useAuth } from '../contexts/AuthContext';

export const useSensors = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, token } = useAuth();

  const fetchSensors = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await sensorService.getAllSensors();
      setSensors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sensors');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const addSensor = useCallback(async (sensorData: SensorFormData): Promise<boolean> => {
    if (!isAuthenticated || !token) {
      setError('Authentication required');
      return false;
    }

    try {
      const newSensor = await sensorService.createSensor(sensorData);
      setSensors(prev => [...prev, newSensor]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sensor');
      return false;
    }
  }, [isAuthenticated, token]);

  const updateSensor = useCallback(async (id: number, sensorData: Partial<SensorFormData>): Promise<boolean> => {
    if (!isAuthenticated || !token) {
      setError('Authentication required');
      return false;
    }

    try {
      const updatedSensor = await sensorService.updateSensor(id, sensorData);
      setSensors(prev => prev.map(sensor => 
        sensor.id === id ? updatedSensor : sensor
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sensor');
      return false;
    }
  }, [isAuthenticated, token]);

  const deleteSensor = useCallback(async (id: number): Promise<boolean> => {
    if (!isAuthenticated || !token) {
      setError('Authentication required');
      return false;
    }

    try {
      await sensorService.deleteSensor(id);
      setSensors(prev => prev.filter(sensor => sensor.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sensor');
      return false;
    }
  }, []);

  const getSensorStats = useCallback((): SensorStats => {
    const stats = sensors.reduce((acc, sensor) => {
      acc.total++;
      switch (sensor.status) {
        case 'ACTIVE':
          acc.active++;
          break;
        case 'INACTIVE':
          acc.inactive++;
          break;
        case 'MAINTENANCE':
          acc.maintenance++;
          break;
        case 'ERROR':
          acc.error++;
          break;
      }
      return acc;
    }, { total: 0, active: 0, inactive: 0, maintenance: 0, error: 0 });

    return stats;
  }, [sensors]);

  const filterSensors = useCallback((filters: SensorFilters): Sensor[] => {
    return sensors.filter(sensor => {
      if (filters.status && sensor.status !== filters.status) return false;
      if (filters.type && sensor.type !== filters.type) return false;
      if (filters.location && !sensor.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          sensor.sensorCode.toLowerCase().includes(searchLower) ||
          sensor.location.toLowerCase().includes(searchLower) ||
          sensor.type.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [sensors]);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  return {
    sensors,
    loading,
    error,
    refetch: fetchSensors,
    addSensor,
    updateSensor,
    deleteSensor,
    getSensorStats,
    filterSensors,
  };
};