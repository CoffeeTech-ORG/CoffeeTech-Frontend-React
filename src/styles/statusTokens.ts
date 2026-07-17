/**
 * State colour for the whole app, on FOUR SEPARATE AXES. They all use green but mean different
 * things, and merging them would be a mistake. One colour only communicates if it means the same
 * everywhere, so every state colour comes from here rather than a per-component literal.
 *
 * Mirrored in `variables.scss` for the SCSS, which cannot import TS: change one, change the other.
 * There is NO dark theme, by decision -- see the note in `variables.scss`.
 *
 * The four axes:
 *
 *  1. DIAGNOSIS SEVERITY -- how urgent it is to act on the crop. The ONLY axis that uses
 *     terracotta. Terracotta = "the crop needs something".
 *
 *  2. DEVICE STATE -- a technical fact, not a judgement. A silent hub is an installation problem,
 *     not a crop one. Never terracotta.
 *
 *  3. CROP STAGE -- categorical and ordinal, no good or bad. Maduracion is not "worse" than
 *     vegetativo. Told apart by its illustration, not its colour. Neutral.
 *
 *  4. SERIES IDENTITY -- arbitrary. The colour only tells one chart line from another, so nitrogen
 *     cannot be amber: it would read as "warning" where it only says "this line is N".
 *
 * Rule of thumb: colour answering "how bad is this?" goes to axis 1, "is it on?" to axis 2, "what
 * is this?" to axis 3 or 4.
 */

export interface StatusToken {
  /** Text and icons over a light background. Contrast ≥ 4.5:1 (WCAG AA). */
  fg: string;
  /** Faint fill for chips and strips. */
  bg: string;
  /** Bordes y trazos. */
  border: string;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// Axis 1 · Diagnosis severity
// ═══════════════════════════════════════════════════════════════════════════════════════
export type StatusTone = 'ok' | 'neutral' | 'warning' | 'alert';

export const STATUS_TOKENS: Record<StatusTone, StatusToken> = {
  /** Inside what the engine considers good. Nothing to do. */
  ok: { fg: '#3a7d52', bg: '#e6f0e6', border: '#bcd6c2' },
  /**
   * Outside the optimal range but NOT urgent: something to know, not to run for. High potassium is
   * the case: the engine's advice is "apply no more", which is neither an alarm nor a pass. Green
   * would say "all fine", red would overstate it.
   */
  neutral: { fg: '#5c6152', bg: '#eceef0', border: '#d6d9d2' },
  /** Worth acting on soon: low phosphorus, fungal risk, heat. */
  warning: { fg: '#9a6b12', bg: '#f6ecd2', border: '#e2c98c' },
  /** Act now: wet leaf, acute heat, low potassium in ripening. */
  alert: { fg: '#b5451f', bg: '#f7e5dd', border: '#e0a88f' },
};

/** Strong urgency accent: the dashboard banner and the card border that asks for action. */
export const URGENCY_ACCENT = '#e0742f';

/** Severity as the rule engine publishes it. */
export type EngineSeverity = 'info' | 'warning' | 'alert' | 'critical';

/**
 * Maps (engine severity + whether it is in the optimal range) to the visual tone. The engine marks
 * both "adecuado" and "alto" as `info`, which are not alarms but are not the same either, so the
 * second argument is needed: without it both would come out green.
 */
export const toneFor = (severity: EngineSeverity, inOptimal: boolean): StatusTone => {
  if (severity === 'alert' || severity === 'critical') return 'alert';
  if (severity === 'warning') return 'warning';
  return inOptimal ? 'ok' : 'neutral';
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// Axis 1b · Actionability  (A / B / C)
// ═══════════════════════════════════════════════════════════════════════════════════════
/**
 * Crosses with severity, does not replace it: the BORDER says how serious, the LABEL says whether
 * anything can be done today. Different questions -- showing an alert that needs a lab with the
 * same visual urgency as an actionable one sends the user running at a closed door.
 */
export type ActionCategory = 'A' | 'B' | 'C';

export const ACTION_LABELS: Record<ActionCategory, string> = {
  A: 'Puedes actuar hoy',
  B: 'De fondo',
  C: 'Para saber',
};

/**
 * B and C are always neutral, even at high severity: if the user cannot resolve it today,
 * shouting does not help.
 */
export const actionTokens = (category: ActionCategory): StatusToken =>
  category === 'A' ? STATUS_TOKENS.warning : STATUS_TOKENS.neutral;

// ═══════════════════════════════════════════════════════════════════════════════════════
// Axis 2 · Device state
// ═══════════════════════════════════════════════════════════════════════════════════════
/**
 * OWN values, not taken from `STATUS_TOKENS`. Reusing the severity ramp would paint `ERROR`
 * terracotta -- the colour for "the crop needs something" -- but a broken hub is an installation
 * problem, and the reader should go check the device, not fertilise. This axis never uses
 * terracotta.
 */
export type DeviceStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'ERROR';

export const DEVICE_TOKENS: Record<DeviceStatus, StatusToken> = {
  /** Reporting normally. */
  ACTIVE: { fg: '#3a7d52', bg: '#e6f0e6', border: '#bcd6c2' },
  /** Silent. Not a fault: it may be off on purpose or out of campaign. */
  INACTIVE: { fg: '#9aa2ac', bg: '#eceef0', border: '#d6d9d2' },
  /** Intervention in progress, expected back. */
  MAINTENANCE: { fg: '#9a6b12', bg: '#f6ecd2', border: '#e2c98c' },
  /** A real fault: go and see it. Strong amber, NOT terracotta. */
  ERROR: { fg: '#8a5a0b', bg: '#f6ecd2', border: '#e2c98c' },
};

export const deviceStatusTokens = (status: DeviceStatus): StatusToken =>
  DEVICE_TOKENS[status] ?? DEVICE_TOKENS.INACTIVE;

/** A hub that reports but serves no section. */
export const UNASSIGNED_TOKEN: StatusToken = {
  fg: '#9aa2ac',
  bg: '#eceef0',
  border: '#d6d9d2',
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// Axis 3 · Phenological stage
// ═══════════════════════════════════════════════════════════════════════════════════════
/** Neutral on purpose. The stage is told apart by its illustration, not its colour. */
export const STAGE_TOKEN: StatusToken = {
  fg: '#3f443a',
  bg: 'transparent',
  border: '#d4d2ca',
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// Axis 4 · Series identity in charts
// ═══════════════════════════════════════════════════════════════════════════════════════
/** Arbitrary: it only tells one line from another. No value means good or bad. */
export const SERIES_COLORS = {
  N: '#08979c',
  P: '#531dab',
  K: '#c41d7f',
  temperature: '#b5651d',
  humidity: '#1d6fa8',
  soilMoisture: '#5a7d3a',
  rain: '#1d6fa8',
} as const;

export type SeriesKey = keyof typeof SERIES_COLORS;
