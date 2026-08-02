/**
 * Helpers for drawing the engine's reference over the Reports chart. They live outside the
 * component so the real logic (classifying a reading, computing the axis domain) can be tested
 * without mounting the chart.
 */
import { ChartDataPoint } from '../../../types/report.types';
import { ReferenceBand, ReferenceMetric } from '../../../services/reference.service';
import { STATUS_TOKENS, StatusToken, toneFor } from '../../../styles/statusTokens';

export type Severity = 'info' | 'warning' | 'alert' | 'critical';

/** Verdict on ONE reading against the engine's reference. */
export interface ValueVerdict {
  /** Short chip text: "Adecuado", "Bajo", "Hoja mojada"… */
  label: string;
  /**
   * What the label means, in the engine's own words: "hoja mojada: infección de roya", "calor:
   * estrés y riesgo de maduración prematura". Comes from `label_es` on the thresholds. `null`
   * when the engine publishes none: the NPK bands only have "bajo"/"adecuado"/"alto", which the
   * chip already says.
   */
  explanation: string | null;
  severity: Severity;
  /** The value that was classified. */
  value: number;
  unit: string;
  /** true when the engine marks the metric as an untraceable proxy (N). */
  provisional: boolean;
  /**
   * true only in the adequate band. Needed apart from `severity` because the engine marks both
   * "adecuado" and "alto" as `info`: high K is not an alarm, but its message is "apply no more
   * potassium", so painting both green would say the opposite of what the engine advises.
   */
  inOptimal: boolean;
}

export interface Verdict extends ValueVerdict {
  /**
   * Fraction of the period (0-1) the engine would pass -- see `coverageOk`: inside the band if
   * there is one, no threshold crossed if there are thresholds, `null` if the engine does not
   * judge this metric. The chip judges the LAST reading, so this keeps a phosphorus that dips
   * below the band dozens of times from reading as "adecuado" just because the last point was.
   */
  coverage: number | null;
}

/**
 * What the sensor MEASURED over the period: mean, min and max. Separate from the verdict, which
 * judges the last reading against the band; this describes the whole range. A good last reading
 * must not stand in for a month of swings.
 */
export const observedFor = (
  data: ChartDataPoint[],
  key: keyof ChartDataPoint
): { avg: number; min: number; max: number } | null => {
  const values = data
    .map((point) => point[key])
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (values.length === 0) return null;

  return {
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

/** A series' last non-empty reading; the one that gets judged. */
export const latestValue = (
  data: ChartDataPoint[],
  key: keyof ChartDataPoint
): number | undefined => {
  for (let i = data.length - 1; i >= 0; i -= 1) {
    const raw = data[i][key];
    if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  }
  return undefined;
};

/**
 * Classifies a value against the bands the engine publishes. Returns null outside the calibrated
 * domain, where the engine also declines to classify (it suppresses the prescription), so the UI
 * must not invent a verdict.
 */
export const bandFor = (
  metric: ReferenceMetric,
  value: number
): ReferenceBand | null => {
  const bands = metric.bands ?? [];
  // The last band includes its upper edge; the rest are [from, to).
  for (let i = 0; i < bands.length; i += 1) {
    const band = bands[i];
    const isLast = i === bands.length - 1;
    const inside = isLast
      ? value >= band.from && value <= band.to
      : value >= band.from && value < band.to;
    if (inside) return band;
  }
  return null;
};

/**
 * What fraction of the period (0-1) the engine would pass.
 *
 * One definition for both reference shapes, via `judgeValue().inOptimal`: inside the adequate
 * band when there is a band, no threshold crossed when there are thresholds. `null` for
 * `relative`, where the engine does not judge. Readings outside the calibrated domain stay out
 * of the denominator: there `judgeValue` returns `null` because the engine abstains, and counting
 * them as "out" would attribute a verdict it never gave.
 */
export const coverageOk = (
  metric: ReferenceMetric | undefined,
  data: ChartDataPoint[],
  key: keyof ChartDataPoint
): number | null => {
  if (!metric || metric.kind === 'relative') return null;

  let juzgadas = 0;
  let buenas = 0;
  data.forEach((point) => {
    const raw = point[key];
    if (typeof raw !== 'number' || Number.isNaN(raw)) return;
    const verdict = judgeValue(metric, raw);
    if (!verdict) return;
    juzgadas += 1;
    if (verdict.inOptimal) buenas += 1;
  });

  return juzgadas === 0 ? null : buenas / juzgadas;
};

/**
 * Verdict on a SINGLE value against the engine's reference. `null` when no verdict applies:
 *  - `relative` (soil moisture): the engine derives the threshold from each plot's wet-dry
 *    envelope, not from an absolute percentage.
 *  - outside the sensor's calibrated domain: the engine suppresses the prescription there, so the
 *    UI must not invent one (neither green nor red: "cannot tell").
 *
 * Used by the Reports chart (on a series' last reading) and the section detail's live panel (on
 * the current reading). One classification for both.
 */
export const judgeValue = (
  metric: ReferenceMetric | undefined,
  value: number
): ValueVerdict | null => {
  if (!metric || metric.kind === 'relative') return null;
  if (!Number.isFinite(value)) return null;

  const provisional = metric.provisional === true;

  /**
   * Threshold crossed by the reading; the most severe wins. Used in both branches: temperature
   * arrives with `kind: 'band'` AND thresholds, and the thresholds carry the explanatory phrase.
   *
   * `reduce`, not a `forEach` with an outer variable: assigning inside the callback makes
   * TypeScript's flow analysis narrow the variable to `never`, so `hit.label` stops compiling.
   */
  const crossed = (metric.thresholds ?? []).reduce<
    { label: string; explanation: string; severity: Severity } | null
  >((acc, threshold) => {
    const hit =
      (threshold.above !== undefined && value >= threshold.above) ||
      (threshold.below !== undefined && value <= threshold.below);
    return hit
      ? { label: threshold.short_es, explanation: threshold.label_es, severity: threshold.severity }
      : acc;
  }, null);

  if (metric.kind === 'band') {
    const band = bandFor(metric, value);
    if (!band) return null;
    return {
      label: band.label_es,
      explanation: crossed?.explanation ?? null,
      severity: band.severity,
      value,
      unit: metric.unit,
      provisional,
      inOptimal: band.label === 'adequate',
    };
  }

  return {
    label: crossed ? crossed.label : 'Sin alerta',
    explanation: crossed?.explanation ?? null,
    severity: crossed ? crossed.severity : 'info',
    value,
    unit: metric.unit,
    provisional,
    // With thresholds, "fine" means none was crossed.
    inOptimal: crossed === null,
  };
};

/**
 * Verdict on a series' LAST reading, with the period's coverage. The chip judges the last datum;
 * `coverage` counts how many readings fell inside the band, so a phosphorus that dips dozens of
 * times does not read as "adecuado" on the strength of the last point alone.
 */
export const verdictFor = (
  metric: ReferenceMetric | undefined,
  data: ChartDataPoint[],
  key: keyof ChartDataPoint
): Verdict | null => {
  const value = latestValue(data, key);
  if (value === undefined) return null;

  const verdict = judgeValue(metric, value);
  if (!verdict) return null;

  return { ...verdict, coverage: coverageOk(metric, data, key) };
};

/**
 * Y-axis domain covering the data AND the reference. Fit to the data alone, the axis clips the
 * band: with K at 130 it closes at 140 and the adequate band's ceiling (156) falls off-canvas,
 * which is exactly what the user needs to see to know how much headroom there is.
 */
export const axisDomainFor = (
  metric: ReferenceMetric | undefined,
  data: ChartDataPoint[],
  key: keyof ChartDataPoint
): [number, number] | undefined => {
  const values = data
    .map((point) => point[key])
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (values.length === 0) return undefined;

  const anchors = [...values];
  if (metric?.optimal) anchors.push(...metric.optimal);
  (metric?.thresholds ?? []).forEach((threshold) => {
    const value = threshold.above ?? threshold.below;
    if (value !== undefined) anchors.push(value);
  });

  const lo = Math.min(...anchors);
  const hi = Math.max(...anchors);
  const pad = Math.max((hi - lo) * 0.1, 1);
  // Do not go below 0 for magnitudes that cannot be negative (all the sensor's).
  return [Math.max(0, Math.floor(lo - pad)), Math.ceil(hi + pad)];
};

/** Did this reading detect rain? The FC-37 answers yes/no at the sampling instant. */
export const isRaining = (point: ChartDataPoint): boolean =>
  point.precipitation === 1 || point.precipitation === true;

/**
 * Rain spans, in milliseconds, to draw as a background strip.
 *
 * A reading is a sample that holds until the next one, not an instant: if 14:10 says rain and
 * 14:12 says none, it rained across that span. So a span ends at the FIRST reading that says no,
 * not the last that said yes; at the end of the series there is no next, so a typical interval is
 * added. Spanning first-to-last rain reading instead gives `x1 === x2` for a single reading, a
 * zero-width rectangle recharts draws as nothing.
 *
 * Returns the real duration. The MINIMUM visible width is the caller's job -- only it knows how
 * many pixels there are -- and this function must not exaggerate a duration.
 */
export const rainSpans = (
  data: ChartDataPoint[],
  /** Sensor rhythm (`sensorRhythm`), to close a span that reaches the end of the series. */
  rhythm: number | null
): Array<{ x1: number; x2: number }> => {
  const spans: Array<{ x1: number; x2: number }> = [];
  let start: number | null = null;
  const step = rhythm ?? 60_000;

  data.forEach((point, index) => {
    const raining = isRaining(point);
    if (raining && start === null) start = point.t;
    // Closes at THIS reading, the first dry one: it could only have rained up to here.
    if (!raining && start !== null) {
      spans.push({ x1: start, x2: point.t });
      start = null;
    }
    if (raining && index === data.length - 1 && start !== null) {
      spans.push({ x1: start, x2: point.t + step });
      start = null;
    }
  });

  return spans;
};

/**
 * How the engine's reference is stated for this metric. Returns the pieces resolved so the row
 * always places them in the same spot, for all three shapes the engine publishes: `optimal` for
 * the band, `short_es` + `above`/`below` for each threshold, and `note` for why a relative metric
 * has no range. Without one place, the reader cannot tell "no reference" from "we forgot".
 */
export interface ReferenceStatement {
  kind: 'band' | 'threshold' | 'relative';
  /** «15–23 °C» en el caso de banda. */
  range: string | null;
  /** One text per threshold: "wet leaf from 90 %". */
  thresholds: string[];
  /** `relative` only: the reason the engine gives for not fixing a range. */
  reason: string | null;
}

export const describeReference = (
  metric: ReferenceMetric | undefined,
  words: { from: string; below: string }
): ReferenceStatement | null => {
  if (!metric) return null;

  if (metric.kind === 'band' && metric.optimal) {
    return {
      kind: 'band',
      range: `${metric.optimal[0]}–${metric.optimal[1]} ${metric.unit}`,
      thresholds: [],
      reason: null,
    };
  }

  if (metric.kind === 'threshold') {
    return {
      kind: 'threshold',
      range: null,
      thresholds: (metric.thresholds ?? []).flatMap((th) => {
        // `above` and `below` read differently: one is a ceiling crossed going up, the other a
        // floor crossed going down. Saying "from" for both would invert the sense.
        if (th.above !== undefined) {
          return [`${th.short_es.toLowerCase()} ${words.from} ${th.above} ${metric.unit}`];
        }
        if (th.below !== undefined) {
          return [`${th.short_es.toLowerCase()} ${words.below} ${th.below} ${metric.unit}`];
        }
        return [];
      }),
      reason: null,
    };
  }

  return { kind: 'relative', range: null, thresholds: [], reason: metric.note ?? null };
};

/**
 * Visual tokens for the verdict chip, from the app's single state scale (`styles/statusTokens`).
 * No colour is decided here: the engine's verdict is mapped to its tone.
 */
export const verdictTokens = (verdict: ValueVerdict): StatusToken =>
  STATUS_TOKENS[toneFor(verdict.severity, verdict.inOptimal)];

/**
 * The engine's labels come with different capitalisation by origin: NPK bands lowercase
 * ("adecuado", "alto") because they also embed mid-sentence in the agronomist's message,
 * thresholds capitalised ("Riesgo fúngico"). As chips they sit together, so the case is
 * normalised here, in the presentation layer, without touching the engine's text.
 */
export const chipLabel = (label: string): string =>
  label.length === 0 ? label : label.charAt(0).toUpperCase() + label.slice(1);
