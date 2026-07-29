import React from 'react';
import { AgronomicEventType } from '../../types/api.types';
import { Flower2, Sprout, PackageCheck, FlaskConical, Mountain } from 'lucide-react';
import type { Language } from '../../contexts/I18nContext';

/**
 * Icon per event type. The texts live in the dictionary
 * (`log.type.<type>.label|hint|question|placeholder`), not here; only the icon stays in code, a
 * lucide one that does not change with the language. Colour axis 3 -- categorical, no judgement:
 * no stage or task is "bad", so what tells one type from another is the icon shape, not a tone.
 */
export const EVENT_ICON: Record<AgronomicEventType, React.ReactNode> = {
  flowering: <Flower2 size={15} />,
  fertilization: <Sprout size={15} />,
  harvest_end: <PackageCheck size={15} />,
  soil_sampling: <FlaskConical size={15} />,
  liming: <Mountain size={15} />,
};

export const EVENT_ORDER: AgronomicEventType[] = [
  'flowering', 'fertilization', 'harvest_end', 'soil_sampling', 'liming',
];

const DAY = 86_400_000;

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

export const daysSince = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / DAY));
};

/**
 * Today, in the user's calendar. `toISOString()` gives the UTC date, which in Peru (UTC-5) is
 * tomorrow's after 19:00, so the quick log entry would be born a day ahead. These are calendar
 * dates (flowering was a day, not an instant), composed from the local getters, and they do NOT
 * go through `utils/freshness`' `parseInstant`, which assumes UTC.
 */
export const todayISO = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

/** The active language decides the format, so the log does not stay on `es-ES` in English. */
const locale = (lang: Language) => (lang === 'en' ? 'en-GB' : 'es-ES');

export const formatDate = (iso: string | Date, lang: Language = 'es') => {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(locale(lang), { year: 'numeric', month: 'short', day: 'numeric' });
};

/** Abbreviated date (no year) for narrow labels. */
export const formatShort = (d: Date, lang: Language = 'es') =>
  d.toLocaleDateString(locale(lang), { month: 'short', day: 'numeric' });

/**
 * Colour semantics (same rule as the recommendation cards, so a colour means the same everywhere):
 *   ok     (green)   -> genuinely up to date, nothing needed.
 *   info   (neutral) -> informational: a countdown or a future window is not "all fine", and green
 *                       here would dilute green.
 *   warn   (amber)   -> something is approaching or worth attending.
 *   alert  (orange)  -> act now / active risk.
 *   muted  (grey)    -> a window already past, no pending action.
 */
export type StatusTone = 'ok' | 'info' | 'warn' | 'alert' | 'muted';

/** What to say, not yet said: the view translates it. */
export interface StatusResult {
  key: string;
  vars?: Record<string, string | number>;
  tone: StatusTone;
}

/**
 * The consequence derived from each type's last event: what closes the loop for the user ("this
 * is what noting it was for"). The same windows the engine uses, computed here with date
 * arithmetic so the view is not coupled to the service.
 *
 * Returns a KEY and variables, not an assembled sentence: the window arithmetic does not change
 * with the language, the text does.
 */
export function statusFor(
  type: AgronomicEventType,
  iso: string,
  lang: Language = 'es',
): StatusResult {
  const d = new Date(iso);
  const days = daysSince(iso);

  switch (type) {
    case 'flowering': {
      // The berry is only colonisable by the borer from ~120 days after flowering.
      if (days >= 300) return { key: 'log.status.flowering.stale', tone: 'warn' };
      // Countdown: information, not good news -> neutral.
      if (days < 120) return { key: 'log.status.flowering.countdown', vars: { days: 120 - days }, tone: 'info' };
      return {
        key: 'log.status.flowering.since',
        vars: { date: formatShort(addDays(d, 120), lang) },
        tone: 'alert',
      };
    }
    case 'harvest_end': {
      // The RE-RE pass is done 2-3 weeks after the last one.
      if (days < 14) {
        return {
          key: 'log.status.harvest.window',
          vars: { from: formatShort(addDays(d, 14), lang), to: formatShort(addDays(d, 21), lang) },
          tone: 'warn',
        };
      }
      if (days <= 21) return { key: 'log.status.harvest.now', tone: 'alert' };
      // Whether the pass was done is unknown (there is no event for it): stated neutral, without
      // assuming it was skipped.
      return { key: 'log.status.harvest.past', tone: 'muted' };
    }
    case 'soil_sampling': {
      if (days >= 730) return { key: 'log.status.sampling.due', tone: 'warn' };
      return {
        key: 'log.status.sampling.ok',
        vars: { year: addDays(d, 730).getFullYear() },
        tone: 'ok',
      };
    }
    case 'liming': {
      if (days >= 365) return { key: 'log.status.liming.due', tone: 'warn' };
      return {
        key: 'log.status.liming.ok',
        vars: { year: addDays(d, 365).getFullYear() },
        tone: 'ok',
      };
    }
    case 'fertilization': {
      // The soil sample is taken 3-4 months after the last fertilising: an informational window,
      // not an "all in order".
      if (days < 100) {
        return {
          key: 'log.status.fertilization.from',
          vars: { date: formatShort(addDays(d, 100), lang) },
          tone: 'info',
        };
      }
      return { key: 'log.status.fertilization.good', tone: 'info' };
    }
    default:
      return { key: '', tone: 'muted' };
  }
}
