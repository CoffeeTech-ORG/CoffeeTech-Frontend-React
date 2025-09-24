export interface WeatherData {
  cityName: string;
  temperature: number;
  mainCondition: string;
  realFeel: number;
  date: string;
  location: string;
  condition: string;
}

export interface WeatherApiResponse {
  name: string;
  main: {
    temp: number;
    feels_like: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
}

export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}