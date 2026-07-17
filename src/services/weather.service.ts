import { WeatherData, WeatherApiResponse, GeolocationPosition } from '../types/weather.types';

export class WeatherService {
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** Weather for a named city. */
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
   * Weather at a coordinate: the right way for a farm. OpenWeather's grid does not resolve the few
   * kilometres between the district and the plot, so it works with an exact or approximate point.
   * Querying by city name instead depends on the PHONE's position and shows Lima at sea level for
   * Cajamarca farms at 1600 m.
   */
  async getWeatherAt(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${WeatherService.BASE_URL}?lat=${latitude}&lon=${longitude}` +
          `&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.status} ${response.statusText}`);
      }

      const data: WeatherApiResponse = await response.json();
      return this.transformWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data by coordinates:', error);
      throw new Error('Failed to load weather data');
    }
  }

  /** Current city from geolocation. */
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
      // Fall back to a default city if the location cannot be obtained
      return 'Lima, Peru';
    }
  }

  /** The user's current position. */
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

  /** City name from coordinates, via reverse geocoding. */
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

  /** Maps the API data to the internal format. */
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

  /** Weather for the user's current location. */
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

// Singleton instance of the weather service
// Nota: Debes configurar tu API key de OpenWeatherMap
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
export const weatherService = new WeatherService(API_KEY);