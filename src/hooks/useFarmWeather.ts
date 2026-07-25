import { useEffect, useState } from 'react';
import { weatherService } from '../services/weather.service';
import { Farm } from '../services/farms.service';
import { WeatherData } from '../types/weather.types';

/**
 * A farm's weather changes slowly; re-requesting it on every render spends quota and makes the user
 * wait for the same number.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;

const cache = new Map<string, { at: number; data: WeatherData }>();

/**
 * Weather AT THE FARM, from its coordinate.
 *
 * The farms are in Cajamarca and San Ignacio, at 1600-2300 m, so the phone's city weather -- with a
 * fixed fallback to Lima on a denied permission -- described a place at sea level and hundreds of
 * kilometres away. It also feeds nothing: the rain the rule engine uses comes from the FC-37 sensor,
 * not this API.
 *
 * Returns `null` while the farm has no coordinate. The caller must tell that case from "loading" and
 * ask for the farm to be located, rather than show some other place's weather.
 */
export const useFarmWeather = (farm: Farm | null) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const lat = farm?.latitude ?? null;
  const lng = farm?.longitude ?? null;

  useEffect(() => {
    if (lat === null || lng === null) {
      setWeather(null);
      return;
    }

    // Rounded: two points less than ~100 m apart share a weather cell, so dragging the pin a few
    // metres must not trigger another request.
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      setWeather(hit.data);
      return;
    }

    let cancelled = false;
    setLoading(true);
    weatherService
      .getWeatherAt(lat, lng)
      .then((data) => {
        cache.set(key, { at: Date.now(), data });
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        // A weather failure must not break the farm view: it is supporting data.
        if (!cancelled) setWeather(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return { weather, loading };
};
