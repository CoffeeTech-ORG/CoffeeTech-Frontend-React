/**
 * The weather condition, in the interface language.
 *
 * OpenWeather returns two texts and both come in English: `description` ("broken clouds") and `main`,
 * a closed enum of fifteen values. The interface painted the first as-is, so a Spanish app read
 * "broken clouds", lowercase and outside i18n.
 *
 * Translated here and not by asking the API for `&lang=es` on purpose: the app's own switch sets the
 * language, so the weather changes with it without depending on another request or on which languages
 * the provider supports. If a code not in the list ever arrives, it falls back to the API's
 * description: English text is better than a gap.
 */

/** The fifteen values of `weather[0].main` OpenWeather documents. */
export const WEATHER_CODES = [
  'Thunderstorm',
  'Drizzle',
  'Rain',
  'Snow',
  'Mist',
  'Smoke',
  'Haze',
  'Dust',
  'Fog',
  'Sand',
  'Ash',
  'Squall',
  'Tornado',
  'Clear',
  'Clouds',
] as const;

export type WeatherCode = (typeof WEATHER_CODES)[number];

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export const weatherConditionLabel = (
  mainCondition: string | undefined,
  fallback: string | undefined,
  t: Translate
): string => {
  const code = (WEATHER_CODES as readonly string[]).includes(mainCondition ?? '')
    ? (mainCondition as WeatherCode)
    : null;

  if (!code) return fallback ?? '';

  return t(`weather.condition.${code.toLowerCase()}`);
};
