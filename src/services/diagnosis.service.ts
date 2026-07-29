import { api } from './api.service';
import { API_ENDPOINTS } from './api.endpoints';

/**
 * Reads each hub's CURRENT diagnosis from the recommendations the backend stores.
 *
 * The rule engine publishes everything the redesign needs -- severity, actionability category
 * A/B/C, and the two messages (`farmer_message` and `agronomist_message`) -- but it arrives as a
 * string inside `recommendationDescription`.
 *
 * Only the most recent is used: a hub accumulates recommendations for months (23 for one device in
 * the test database), so taking any would turn a half-year-old alert into today's alarm.
 *
 * Two formats coexist: the engine writes JSON with `summary` and `items`; older records are free
 * Spanish text. The old text is NOT interpreted -- it is marked `legacy`, and consumers must treat
 * it as "cannot tell", which is more honest than guessing an urgency by scanning for words.
 */

export type DiagnosisSeverity = 'info' | 'warning' | 'alert' | 'critical';

/** Actionability category the engine publishes. See `statusTokens.ts`. */
export type DiagnosisCategory = 'A' | 'B' | 'C';

export interface DiagnosisItem {
  ruleId: string;
  severity: DiagnosisSeverity;
  severityLabel?: string;
  category?: DiagnosisCategory;
  actionabilityLabel?: string;
  subject?: string;
  farmerMessage: string;
  agronomistMessage?: string;
  action?: string;
}

export interface HubDiagnosis {
  deviceHubId: string;
  createdAt: string | null;
  /** `true` when the recommendation is the old format and cannot be interpreted. */
  legacy: boolean;
  /** How many of each severity. Empty if `legacy`. */
  counts: { alert: number; warning: number; info: number };
  items: DiagnosisItem[];
}

interface RawRecommendation {
  id: number | string;
  deviceHubId?: string;
  recommendationDescription?: string;
  createdAt?: string | null;
}

const vacio = { alert: 0, warning: 0, info: 0 };

const parse = (raw: RawRecommendation): HubDiagnosis => {
  const base: HubDiagnosis = {
    deviceHubId: String(raw.deviceHubId ?? ''),
    createdAt: raw.createdAt ?? null,
    legacy: true,
    counts: { ...vacio },
    items: [],
  };

  const texto = raw.recommendationDescription ?? '';
  if (!texto.trimStart().startsWith('{')) return base; // formato antiguo

  try {
    const d = JSON.parse(texto);
    const items: DiagnosisItem[] = (d.items ?? []).map((it: any) => ({
      ruleId: it.rule_id,
      severity: it.severity,
      severityLabel: it.severity_label,
      category: it.category,
      actionabilityLabel: it.actionability_label,
      subject: it.subject,
      farmerMessage: it.farmer_message,
      agronomistMessage: it.agronomist_message,
      action: it.action,
    }));
    return {
      ...base,
      legacy: false,
      counts: { ...vacio, ...(d.summary ?? {}) },
      items,
    };
  } catch {
    // Malformed JSON: treated as legacy instead of inventing a state.
    return base;
  }
};

/**
 * Current diagnosis per hub, indexed by `deviceHubId`. ONE request for the whole app: the endpoint
 * returns the full history and it is reduced to each device's latest here.
 */
export const fetchLatestDiagnoses = async (): Promise<Record<string, HubDiagnosis>> => {
  const res = await api.get<RawRecommendation[]>(API_ENDPOINTS.RECOMMENDATIONS);
  const porHub: Record<string, HubDiagnosis> = {};

  for (const raw of res.data ?? []) {
    const d = parse(raw);
    if (!d.deviceHubId) continue;

    const previa = porHub[d.deviceHubId];
    // With no date there is no sorting; the first is kept and not overwritten blindly.
    if (!previa) {
      porHub[d.deviceHubId] = d;
    } else if (d.createdAt && (!previa.createdAt || d.createdAt > previa.createdAt)) {
      porHub[d.deviceHubId] = d;
    }
  }

  return porHub;
};

/** `true` if the crop asks for something NOW. Only asserted when data backs it. */
export const needsCropAction = (d?: HubDiagnosis): boolean =>
  !!d && !d.legacy && d.counts.alert > 0;

/**
 * How many alerts the engine raised in a period. Unlike `fetchLatestDiagnoses`, this is about the
 * HISTORY: Reports asks not "how is it today?" but "how many times did the crop ask for something
 * this month?". Diagnoses with at least one alert are counted, not loose items: the engine
 * deduplicates by content, so each record is a real state change, not a repeat.
 *
 * Returns `null` if it could not be queried: the card stays quiet rather than show a zero that
 * would read as "there were none".
 */
export const countAlertsInRange = async (
  hubIds: string[],
  from: Date,
  to: Date
): Promise<number | null> => {
  if (hubIds.length === 0) return 0;

  try {
    const res = await api.get<RawRecommendation[]>(API_ENDPOINTS.RECOMMENDATIONS);
    const hubs = new Set(hubIds.map(String));

    return (res.data ?? []).filter((raw) => {
      if (!hubs.has(String(raw.deviceHubId ?? ''))) return false;
      if (!raw.createdAt) return false;
      const at = new Date(raw.createdAt);
      if (Number.isNaN(at.getTime()) || at < from || at > to) return false;
      const d = parse(raw);
      return !d.legacy && d.counts.alert > 0;
    }).length;
  } catch (error) {
    console.warn('No se pudo contar las alertas del periodo', error);
    return null;
  }
};
