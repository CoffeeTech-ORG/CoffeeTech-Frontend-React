import React from 'react';
import { Cloud, Sun, CloudRain, Zap } from 'lucide-react';
import { WeatherData } from '../../../services/farms.service';
import { useI18n } from '../../../contexts/I18nContext';
import './WeatherWidget.scss';

interface WeatherWidgetProps {
  weather: WeatherData;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  const { t } = useI18n();
  
  const translateCondition = (condition: string): string => {
    const conditionLower = condition.toLowerCase();
    
    // Map common OpenWeatherMap conditions to translation keys
    const conditionMap: Record<string, string> = {
      'clear sky': t('weather.conditions.clearSky'),
      'few clouds': t('weather.conditions.fewClouds'),
      'scattered clouds': t('weather.conditions.scatteredClouds'),
      'broken clouds': t('weather.conditions.brokenClouds'),
      'overcast clouds': t('weather.conditions.overcastClouds'),
      'light rain': t('weather.conditions.lightRain'),
      'moderate rain': t('weather.conditions.moderateRain'),
      'heavy rain': t('weather.conditions.heavyRain'),
      'thunderstorm': t('weather.conditions.thunderstorm'),
      'snow': t('weather.conditions.snow'),
      'mist': t('weather.conditions.mist'),
      'fog': t('weather.conditions.fog'),
      'haze': t('weather.conditions.haze'),
      'drizzle': t('weather.conditions.drizzle'),
    };
    
    return conditionMap[conditionLower] || condition;
  };

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
              {t('weather.realFeel')}: {weather.realFeel}°C<br />
              {translateCondition(weather.condition)}
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