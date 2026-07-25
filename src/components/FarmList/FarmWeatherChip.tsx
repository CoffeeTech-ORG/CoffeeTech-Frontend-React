import React from 'react';
import { Cloud, CloudRain, CloudSun, Sun, Zap } from 'lucide-react';
import { Farm } from '../../hooks/useFarms';
import { useFarmWeather } from '../../hooks/useFarmWeather';
import { useI18n } from '../../contexts/I18nContext';
import { weatherConditionLabel } from '../../utils/weatherCondition';
import './FarmWeatherChip.scss';

/**
 * One farm's weather, at label size, beside its name -- which is where it means something: "it is
 * raining at Los Cedros" reads at a glance with nothing to switch. A large block would spend ~19 %
 * of a phone screen on a single farm's weather while the rest have none.
 *
 * Nothing is shown if the farm has no coordinate: there is no weather to give, and inventing one
 * is worse than saying nothing.
 */
interface FarmWeatherChipProps {
  farm: Farm;
  /**
   * `hero` is the large farm-header version, where the weather competes with nothing and gets
   * headline size. Same data and source, only the size changes, so it is one component and not two
   * that could drift apart.
   */
  variant?: 'chip' | 'hero';
}

export const FarmWeatherChip: React.FC<FarmWeatherChipProps> = ({ farm, variant = 'chip' }) => {
  const { weather } = useFarmWeather(farm);
  const { t } = useI18n();

  if (!weather) return null;

  // The text comes from OpenWeather's `main` code, a closed translatable enum; the API's
  // description is the fallback if a new one appears.
  const label = weatherConditionLabel(weather.mainCondition, weather.condition, t);

  const cond = (weather.mainCondition || '').toLowerCase();
  const size = variant === 'hero' ? 18 : 14;
  const icon =
    cond === 'clear' ? (
      <Sun size={size} aria-hidden="true" />
    ) : cond === 'rain' || cond === 'drizzle' ? (
      <CloudRain size={size} aria-hidden="true" />
    ) : cond === 'thunderstorm' ? (
      <Zap size={size} aria-hidden="true" />
    ) : cond === 'clouds' ? (
      <CloudSun size={size} aria-hidden="true" />
    ) : (
      <Cloud size={size} aria-hidden="true" />
    );

  // No decimals: the difference between 21 and 21.4 degrees changes no decision.
  const temp = Math.round(weather.temperature);

  if (variant === 'hero') {
    return (
      <div className="farm-weather-hero" title={label}>
        <div className="farm-weather-hero__temp">{temp}°</div>
        <div className="farm-weather-hero__cond">
          {icon}
          {label}
        </div>
      </div>
    );
  }

  return (
    <span className="farm-weather-chip" title={label}>
      {icon}
      {temp}°
    </span>
  );
};
