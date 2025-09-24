import { WeatherData, WeatherApiResponse, GeolocationPosition } from '../types/weather.types';

export class WeatherService {
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Obtiene datos del clima para una ciudad específica
   */
  async getWeather(cityName: string): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${WeatherService.BASE_URL}?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.status} ${response.statusText}`);
      }

      const data: WeatherApiResponse = await response.json();
      return this.transformWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error('Failed to load weather data');
    }
  }

  /**
   * Obtiene la ciudad actual basada en la geolocalización
   */
  async getCurrentCity(): Promise<string> {
    try {
      const position = await this.getCurrentPosition();
      const cityName = await this.getCityFromCoordinates(
        position.coords.latitude, 
        position.coords.longitude
      );
      return cityName || 'Unknown Location';
    } catch (error) {
      console.error('Error getting current city:', error);
      // Fallback a una ciudad por defecto si no se puede obtener la ubicación
      return 'Lima, Peru';
    }
  }

  /**
   * Obtiene la posición actual del usuario
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position as GeolocationPosition),
        (error) => {
          console.error('Geolocation error:', error);
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Obtiene el nombre de la ciudad basado en coordenadas usando geocoding reverso
   */
  private async getCityFromCoordinates(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to get city from coordinates');
      }

      const data = await response.json();
      if (data && data.length > 0) {
        const location = data[0];
        return location.name || 'Unknown Location';
      }
      
      return 'Unknown Location';
    } catch (error) {
      console.error('Error getting city from coordinates:', error);
      return 'Unknown Location';
    }
  }

  /**
   * Transforma los datos de la API a nuestro formato interno
   */
  private transformWeatherData(apiData: WeatherApiResponse): WeatherData {
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    return {
      cityName: apiData.name,
      temperature: Math.round(apiData.main.temp),
      mainCondition: apiData.weather[0].main,
      realFeel: Math.round(apiData.main.feels_like || apiData.main.temp),
      date: currentDate,
      location: apiData.name,
      condition: apiData.weather[0].description || apiData.weather[0].main
    };
  }

  /**
   * Obtiene el clima para la ubicación actual del usuario
   */
  async getCurrentWeather(): Promise<WeatherData> {
    try {
      const cityName = await this.getCurrentCity();
      return await this.getWeather(cityName);
    } catch (error) {
      console.error('Error getting current weather:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de clima
// Nota: Debes configurar tu API key de OpenWeatherMap
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
export const weatherService = new WeatherService(API_KEY);