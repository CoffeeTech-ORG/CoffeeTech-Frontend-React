import { useState, useEffect, useCallback } from 'react';
import { weatherService } from '../services/weather.service';
import { WeatherData } from '../types/weather.types';

interface UseWeatherOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // en millisegundos
  city?: string;
}

interface UseWeatherReturn {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
}

export const useWeather = (options: UseWeatherOptions = {}): UseWeatherReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 600000, // 10 minutos por defecto
    city
  } = options;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let weatherData: WeatherData;
      
      if (city) {
        weatherData = await weatherService.getWeather(city);
      } else {
        weatherData = await weatherService.getCurrentWeather();
      }

      setWeather(weatherData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError(errorMessage);
      console.error('Error fetching weather:', err);
    } finally {
      setLoading(false);
    }
  }, [city]);

  const refreshWeather = useCallback(async () => {
    await fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchWeather();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchWeather]);

  return {
    weather,
    loading,
    error,
    refreshWeather
  };
};