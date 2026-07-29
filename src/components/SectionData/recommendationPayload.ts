/**
 * The contract of the JSON the rule engine writes inside `recommendationDescription`. In one file
 * because two pieces consume it -- the verdict on top and the card list -- and interpreting it
 * separately would have them tell different things about the same diagnosis.
 *
 * The engine does NOT send a short headline or steps: it sends `farmer_message` (plain voice),
 * `agronomist_message` (technical voice) and `action` with product, dose, method and timing.
 * What is derived from that is in `sectionVerdict.ts`, and only trims and quotes: no agronomy is
 * written in the front end.
 */

export type Severity = 'critical' | 'alert' | 'warning' | 'info';

/** Actionability: the engine does not say "apply now" where there is nothing to apply. */
export type Actionability = 'direct' | 'verify' | 'consult' | 'structural' | 'monitor' | 'none';

export interface RecAction {
  product?: string;
  dose?: string;
  method?: string;
  method_label?: string;
  timing?: string;
  disclaimer?: string;
}

export interface RecForecast {
  horizon_h?: number;
  detail?: string;
}

export interface RecItem {
  rule_id: string;
  severity: Severity;
  severity_label: string;
  type: string;
  type_label: string;
  subject?: string | null;
  kind?: 'reminder' | 'recommendation';
  category?: 'A' | 'B' | 'C';
  actionability?: Actionability;
  actionability_label?: string;
  saving?: boolean;
  farmer_message: string;
  agronomist_message: string;
  provisional?: boolean;
  refer?: boolean;
  referral_note?: string | null;
  verification?: string | null;
  forecast?: RecForecast | null;
  action?: RecAction | null;
}

export interface RecPayload {
  v: number;
  summary: Record<string, number>;
  items: RecItem[];
  empty_message?: string;
}

/** Orden de triaje: lo urgente primero. */
export const SEV_ORDER: Record<string, number> = {
  critical: 0,
  alert: 1,
  warning: 2,
  info: 3,
};

export const SEVERITY_ORDER: Severity[] = ['critical', 'alert', 'warning', 'info'];

/** Initial capital (first letter only; leaves 'Ojo de gallo', accents, etc. intact). */
export const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Interprets the engine JSON. Returns `null` for the older plain-text format, which consumers show
 * as-is: guessing an urgency by scanning for words would be worse.
 */
export function parsePayload(desc?: string): RecPayload | null {
  if (!desc) return null;
  const s = desc.trim();
  if (!s.startsWith('{')) return null;
  try {
    const data = JSON.parse(s);
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return data as RecPayload;
    }
  } catch {
    // Older format or broken JSON: handled by the component.
  }
  return null;
}

/**
 * A hub's CURRENT recommendation. The backend keeps the full history (23 records for one device in
 * the test database), so taking any would turn a half-year-old alert into today's. The most recent
 * by date is used, and by id if there are no dates.
 */
export const latestRecommendation = <T extends Record<string, any>>(items: T[]): T | null => {
  if (!items.length) return null;
  return [...items].sort((a, b) => {
    const da = a.createdAt || a.updatedAt || a.timestamp;
    const db = b.createdAt || b.updatedAt || b.timestamp;
    if (da && db) return new Date(db).getTime() - new Date(da).getTime();
    const ia = typeof a.id === 'number' ? a.id : parseInt(String(a.id), 10);
    const ib = typeof b.id === 'number' ? b.id : parseInt(String(b.id), 10);
    return ib - ia;
  })[0];
};

/** Diagnosis items sorted by severity, without the static reminders. */
export const diagnosisItems = (payload: RecPayload): RecItem[] =>
  payload.items
    .filter((i) => i.kind !== 'reminder')
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9));

/** Reminders (lab, liming…): long cadence, not the day's state. */
export const reminderItems = (payload: RecPayload): RecItem[] =>
  payload.items.filter((i) => i.kind === 'reminder');
