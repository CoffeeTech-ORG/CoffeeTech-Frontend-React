import { useState, useEffect, useCallback } from 'react';
import { Sensor, SensorFilters, SensorStats } from '../types/sensor.types';
import { sensorService } from '../services/sensor.service';
import { useAuth } from '../contexts/AuthContext';
import { hubStateOf } from '../utils/hubState';

/**
 * The Hub inventory, read-only.
 *
 * No `addSensor`, `updateSensor` or `deleteSensor`: the backend never had `PUT`/`DELETE` routes for
 * the inventory, so those were calls to endpoints that do not exist. Hubs enter the inventory on their
 * own when they first report.
 */
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
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los hubs');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  /**
   * The summary is counted over the DERIVED state, not over `status`. Counting the stored field, a hub
   * dead for months still added to "active" -- see `utils/hubState`.
   */
  const getSensorStats = useCallback((): SensorStats => {
    return sensors.reduce(
      (acc, sensor) => {
        acc.total++;
        acc[hubStateOf(sensor)]++;
        return acc;
      },
      { total: 0, reporting: 0, silent: 0, unassigned: 0, never: 0 }
    );
  }, [sensors]);

  const filterSensors = useCallback(
    (filters: SensorFilters): Sensor[] => {
      return sensors.filter((sensor) => {
        if (filters.states?.length && !filters.states.includes(hubStateOf(sensor))) return false;
        if (filters.searchTerm) {
          // Only the MAC is left as searchable text: `type` was COMBINED on every row and `location`
          // does not exist (where a hub is comes from its assignment, which changes).
          return sensor.deviceHubId.toLowerCase().includes(filters.searchTerm.toLowerCase());
        }
        return true;
      });
    },
    [sensors]
  );

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  return {
    sensors,
    loading,
    error,
    refetch: fetchSensors,
    getSensorStats,
    filterSensors,
  };
};
