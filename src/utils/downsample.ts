/**
 * Time-series reduction that KEEPS the peaks.
 *
 * The sensor reads every 2 min: 720 a day, ~64000 over ninety days, for a screen that is not
 * 64000 px wide. The reduction happens either way; the alternative is the browser stacking
 * readings onto the same pixel into a smear.
 *
 * Averaging by hour or day erases exactly what a history is read for: the one-minute peak. This is
 * largest-triangle-three-buckets (as Grafana and Highcharts use), which computes no new values --
 * it picks real points. It splits the series into buckets and keeps, per bucket, the point forming
 * the largest triangle with the last kept point and the next bucket's average, so a peak survives
 * with its exact time and value and the tooltip can show them.
 *
 * The first and last points are always kept: the period's ends.
 */

export interface TimePoint {
  /** Milliseconds since epoch. The real X axis, not a label. */
  t: number;
}

/**
 * @param data   Series ordered by time.
 * @param key    Numeric field to preserve.
 * @param target How many points to draw (approx. available pixels).
 */
export function downsampleLTTB<T extends TimePoint>(
  data: T[],
  key: keyof T,
  target: number
): T[] {
  // With fewer points than the target there is nothing to reduce: draw them all.
  if (target >= data.length || target < 3 || data.length < 3) return data;

  const valor = (p: T): number => {
    const v = p[key];
    return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
  };

  const salida: T[] = [data[0]];
  // Bucket size, excluding the first and last points, which are fixed.
  const paso = (data.length - 2) / (target - 2);
  let anterior = 0;

  for (let i = 0; i < target - 2; i += 1) {
    const inicio = Math.floor((i + 1) * paso) + 1;
    const fin = Math.min(Math.floor((i + 2) * paso) + 1, data.length - 1);

    // The NEXT bucket's average: the triangle's third vertex.
    const sigInicio = fin;
    const sigFin = Math.min(Math.floor((i + 3) * paso) + 1, data.length);
    const n = Math.max(1, sigFin - sigInicio);
    let sumaT = 0;
    let sumaV = 0;
    for (let j = sigInicio; j < sigFin; j += 1) {
      sumaT += data[j].t;
      sumaV += valor(data[j]);
    }
    const medioT = sumaT / n;
    const medioV = sumaV / n;

    const puntoA = data[anterior];
    const aT = puntoA.t;
    const aV = valor(puntoA);

    let mejorArea = -1;
    let mejor = inicio;
    for (let j = inicio; j < fin; j += 1) {
      // Twice the triangle's area (previous, candidate, next average). No need to halve: they are
      // only compared to each other.
      const area = Math.abs(
        (aT - medioT) * (valor(data[j]) - aV) - (aT - data[j].t) * (medioV - aV)
      );
      if (area > mejorArea) {
        mejorArea = area;
        mejor = j;
      }
    }

    salida.push(data[mejor]);
    anterior = mejor;
  }

  salida.push(data[data.length - 1]);
  return salida;
}

/**
 * The series' slice between two instants, by binary search. The series is time-sorted, so a full
 * `filter` for a contiguous piece is wasted work: two binary searches and a `slice`. With ten
 * thousand readings and a dragging mini-map, that difference is paid every frame.
 */
export function sliceByTime<T extends TimePoint>(data: T[], from: number, to: number): T[] {
  const lowerBound = (target: number, inclusive: boolean) => {
    let lo = 0;
    let hi = data.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const before = inclusive ? data[mid].t <= target : data[mid].t < target;
      if (before) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  return data.slice(lowerBound(from, false), lowerBound(to, true));
}

/**
 * How often this sensor reads: the median interval between readings. Computed ONCE, over the
 * complete series, because it is a property of the device, not of what is on screen; per window it
 * would be eight sorts of thousands of intervals per drag frame, and zoomed in the median would be
 * decided by a handful of readings and the "this is a gap" threshold would drift.
 *
 * Zero intervals do not count: the history holds readings with the same timestamp (several rows in
 * one minute), which would drive the median to 0 and make callers cut nothing, not even a ten-day
 * gap. `null` when the series is too short to judge.
 */
export function sensorRhythm<T extends TimePoint>(data: T[]): number | null {
  if (data.length < 3) return null;

  const positivos = data
    .slice(1)
    .map((p, i) => p.t - data[i].t)
    .filter((d) => d > 0)
    .sort((a, b) => a - b);
  if (positivos.length === 0) return null;

  return positivos[Math.floor(positivos.length / 2)];
}

/**
 * The separation above which two readings mean a GAP rather than the normal rhythm. Both conditions
 * are required:
 *
 *  - Rare for this sensor: several times its rhythm. One reading every 2 min and one every hour
 *    have very different abnormal-gap sizes.
 *  - Wide enough to see: some fraction of the drawn period. Below that the line crossing it is a
 *    couple of pixels and cutting it only shreds the line. The bar is 1/100 of the period (~10 px
 *    of a 1000 px canvas), not 1/50: with two weeks on screen 1/50 is almost seven hours, and a
 *    hub silent six hours would still join with a 19 px line over what nobody measured.
 */
export function gapThreshold(rhythm: number | null, span: number, factor = 6): number | null {
  if (rhythm === null || span <= 0) return null;
  return Math.max(rhythm * factor, span / 100);
}

/**
 * What fraction of the period (0-1) has no readings. Same rule as `breakGaps` (they share
 * `gapThreshold`): a gap rare enough for this series to cut the line also counts as unmeasured
 * period. Says it with a number instead of leaving the user to infer it from an empty chart.
 */
export function gapRatio<T extends TimePoint>(
  data: T[],
  rhythm: number | null,
  factor = 6
): number {
  if (data.length < 3) return 0;
  const limite = gapThreshold(rhythm, data[data.length - 1].t - data[0].t, factor);
  if (limite === null) return 0;

  const span = data[data.length - 1].t - data[0].t;
  let hueco = 0;
  for (let i = 1; i < data.length; i += 1) {
    const d = data[i].t - data[i - 1].t;
    if (d > limite) hueco += d;
  }
  return Math.min(1, hueco / span);
}

/**
 * Cuts the line where the sensor stopped measuring. On a time axis, two readings a week apart join
 * with a straight segment across that whole week -- a line over what nobody measured, looking like
 * smooth data. This inserts a valueless point in each large gap, and the drawer, which does not
 * join empty points, leaves the space blank.
 */
export function breakGaps<T extends TimePoint>(
  data: T[],
  key: keyof T,
  rhythm: number | null,
  factor = 6
): T[] {
  if (data.length < 3) return data;
  const limite = gapThreshold(rhythm, data[data.length - 1].t - data[0].t, factor);
  if (limite === null) return data;

  const salida: T[] = [];
  data.forEach((punto, i) => {
    if (i > 0 && punto.t - data[i - 1].t > limite) {
      salida.push({
        ...punto,
        t: (punto.t + data[i - 1].t) / 2,
        [key]: undefined,
      } as unknown as T);
    }
    salida.push(punto);
  });
  return salida;
}
