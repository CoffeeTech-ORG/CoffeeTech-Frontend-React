import React from 'react';
import { Cloud, Sun, CloudRain, Zap } from 'lucide-react';
import { WeatherData } from '../../../services/farms.service';
import './WeatherWidget.scss';

interface WeatherWidgetProps {
  weather: WeatherData;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  const getWeatherIcon = (mainCondition: string) => {
    const condition = mainCondition.toLowerCase();
    
    switch (condition) {
      case 'clear':
        return <Sun size={40} className="weather-icon--sunny" />;
      case 'clouds':
      case 'mist':
      case 'smoke':
      case 'haze':
      case 'dust':
      case 'fog':
        return (
          <div className="weather-icon">
            <Sun className="sun" size={32} />
            <Cloud className="cloud" size={40} />
          </div>
        );
      case 'rain':
      case 'drizzle':
        return <CloudRain size={40} className="weather-icon--rainy" />;
      case 'thunderstorm':
        return <Zap size={40} className="weather-icon--stormy" />;
      default:
        return <Sun size={40} />;
    }
  };

  return (
    <div className="weather-widget">
      <div className="weather-widget__content">
        <div className="weather-widget__main">
          <h1 className="weather-widget__temperature">
            {weather.temperature}°C
          </h1>
          <div className="weather-widget__location">
            <p className="location">{weather.location}</p>
            <p className="details">
              Real Feel: {weather.realFeel}°C<br />
              {weather.condition}
            </p>
          </div>
        </div>
        
        <div className="weather-widget__visual">
          {getWeatherIcon(weather.mainCondition)}
          <p className="weather-widget__date">{weather.date}</p>
        </div>
      </div>
    </div>
  );
};