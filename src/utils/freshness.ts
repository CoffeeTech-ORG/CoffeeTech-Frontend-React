/**
 * Sensor data freshness. One threshold for the whole app, so the same hub is not judged silent at
 * 12 h by the section list and the farm panel while the section detail still presents its diagnosis
 * as current until 24 h.
 *
 * 12 h is the agreed threshold: short enough that a half-day outage shows, long enough not to alarm
 * over a reboot or a one-off coverage gap.
 */

/** With no readings within this span, the hub counts as silent. */
export const STALE_AFTER_HOURS = 12;

/** Below this the data describes the present and can be called "up to date". */
export const FRESH_WITHIN_HOURS = 3;

/**
 * `unknown` is not an in-between state: it is "no date to judge". Kept apart from `silent` on
 * purpose -- a hub that never reported is not a hub that went silent.
 */
export type FreshnessLevel = 'fresh' | 'aging' | 'silent' | 'unknown';

/**
 * Interprets an INSTANT from the backend, which serves the same instant in two formats by endpoint:
 *
 *   devices.lastSeen        2026-07-28T07:32:51        <- no timezone
 *   data-records.updatedAt  2026-07-28T07:32:51+00:00  <- with offset
 *
 * `new Date()` reads the bare string as LOCAL time. In Peru (UTC-5) that puts the last reading five
 * hours in the future: the section list says "0 min ago" whatever happens, and the 12 h silence
 * threshold behaves like 17 h, so a hub silent since yesterday still reads as "receiving data". The
 * backend writes these in UTC (`devices.last_seen` copies `data_records.created_at`, stored UTC by
 * EF), so the Z is appended to the zoneless string.
 *
 * WARNING: instants only. The log's dates (`eventDate`) arrive just as bare (`2026-07-18T00:00:00`)
 * but are CALENDAR dates: passing them through here would move them a day back in any zone west of
 * Greenwich. Those are parsed as local, correctly, in `agronomicLog.utils`.
 */
export const parseInstant = (at?: string | number | null): Date | null => {
  if (at === null || at === undefined || at === '') return null;

  const raw = String(at);
  // Zoneless ISO date-time: the backend writes it in UTC.
  const naive = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(raw);
  const date = new Date(naive ? `${raw.replace(' ', 'T')}Z` : raw);

  return Number.isNaN(date.getTime()) ? null : date;
};

/** Minutes since a timestamp. `null` if there is no valid date. */
export const minutesSince = (at?: string | number | null): number | null => {
  const date = parseInstant(at);
  if (!date) return null;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
};

/** Hours (with decimals) since a timestamp. */
export const hoursSince = (at?: string | number | null): number | null => {
  const minutes = minutesSince(at);
  return minutes === null ? null : minutes / 60;
};

export const freshnessLevel = (at?: string | number | null): FreshnessLevel => {
  const hours = hoursSince(at);
  if (hours === null) return 'unknown';
  if (hours <= FRESH_WITHIN_HOURS) return 'fresh';
  if (hours <= STALE_AFTER_HOURS) return 'aging';
  return 'silent';
};

/** `true` when the data can no longer back a today's recommendation. */
export const isSilent = (at?: string | number | null): boolean =>
  freshnessLevel(at) === 'silent';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * "hace 20 min" / "hace 3 h" / "hace 2 días", with the active translation. The singular has its own
 * key: the plural form would put "hace 1 días" right above the diagnosis, and a slip there makes
 * the rest of the screen suspect.
 */
export const relativeLabel = (at: string | number | null | undefined, t: Translate): string => {
  const minutes = minutesSince(at);
  if (minutes === null) return '—';
  if (minutes < 60) return t('sensors.time.minutes', { count: minutes });
  if (minutes < 1440) return t('sensors.time.hours', { count: Math.floor(minutes / 60) });
  const days = Math.floor(minutes / 1440);
  return days === 1 ? t('sensors.time.day') : t('sensors.time.days', { count: days });
};
