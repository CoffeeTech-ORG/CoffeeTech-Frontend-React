/**
 * Draws the plot area on canvas, without React.
 *
 * Measured on this screen with recharts: each window change cost 265 ms with six rows and 48 ms
 * with one, about 44 ms per chart regardless of the point count, because the library rebuilds
 * each chart's full React tree (69 DOM nodes). The cost was the machinery, not the data. On
 * canvas there is no tree to rebuild, so a thousand points take tenths of a millisecond and the
 * six rows follow the mini-map drag at 60 fps.
 *
 * NO TEXT is drawn here. Title, verdict, "Medido: promedio…" and the axis labels stay HTML: real,
 * selectable, translatable, accessible text. Canvas only where there are many pixels and no words.
 */

export interface Rect {
  /** Plot area, without the margins reserved for the labels. */
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Scales {
  /** Instant -> horizontal pixel. */
  x: (t: number) => number;
  /** Value -> vertical pixel. */
  y: (v: number) => number;
}

/**
 * All the drawing needs from a reading: its instant. The value is read by name, so no index
 * signature is required; requiring one would exclude `ChartDataPoint`, whose fields are declared
 * one by one.
 */
export interface Point {
  t: number;
}

/** A metric's value in one reading, or null if that reading lacks it (a sensor gap). */
const valueOf = (point: Point, key: string): number | null => {
  const raw = (point as unknown as Record<string, unknown>)[key];
  return typeof raw === 'number' && !Number.isNaN(raw) ? raw : null;
};

/** Space reserved for the labels. */
export const PLOT_PADDING = { left: 48, right: 24, top: 4, bottom: 20 };

export const scalesFor = (
  area: Rect,
  domainX: [number, number],
  domainY: [number, number]
): Scales => {
  const spanX = domainX[1] - domainX[0] || 1;
  const spanY = domainY[1] - domainY[0] || 1;
  return {
    x: (t) => area.left + ((t - domainX[0]) / spanX) * area.width,
    y: (v) => area.top + area.height - ((v - domainY[0]) / spanY) * area.height,
  };
};

/**
 * Prepares the canvas for the screen's density. On retina or at 150 % browser zoom the bitmap has
 * fewer real pixels than the space it fills and the line blurs. The buffer is sized to
 * `css x devicePixelRatio` and the context scaled, so the rest of the drawing stays in CSS pixels.
 */
export const prepare = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): CanvasRenderingContext2D | null => {
  const dpr = window.devicePixelRatio || 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return ctx;
};

/** Converts a palette colour to rgba at the requested opacity. */
const alpha = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/**
 * The rain spans, in two pieces: the proportional strip says how long it lasted, the baseline
 * mark (with a guaranteed minimum width) says it happened. Without the second, a twenty-minute
 * shower in two weeks is 0.05 px and disappears.
 */
export const drawRain = (
  ctx: CanvasRenderingContext2D,
  area: Rect,
  scales: Scales,
  spans: Array<{ x1: number; x2: number }>,
  minWidthMs: number,
  color: string
) => {
  const markHeight = area.height * 0.09;
  spans.forEach((span) => {
    const hasta = Math.max(span.x2, span.x1 + minWidthMs);
    const x = scales.x(span.x1);
    const w = Math.max(1, scales.x(hasta) - x);

    ctx.fillStyle = alpha(color, 0.13);
    ctx.fillRect(x, area.top, w, area.height);
    ctx.fillStyle = alpha(color, 0.5);
    ctx.fillRect(x, area.top + area.height - markHeight, w, markHeight);
  });
};

/** Dotted grid, one line per tick of each axis. */
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  area: Rect,
  scales: Scales,
  ticksX: number[],
  ticksY: number[],
  color: string
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ticksY.forEach((v) => {
    // The half pixel keeps a 1 px line from spreading across two and coming out grey and fat.
    const y = Math.round(scales.y(v)) + 0.5;
    ctx.moveTo(area.left, y);
    ctx.lineTo(area.left + area.width, y);
  });
  ticksX.forEach((t) => {
    const x = Math.round(scales.x(t)) + 0.5;
    ctx.moveTo(x, area.top);
    ctx.lineTo(x, area.top + area.height);
  });
  ctx.stroke();
  ctx.restore();
};

/**
 * The engine's reference: the adequate band with its edges, or the threshold lines. `provisional`
 * draws it fainter -- the engine marks nitrogen so, an untraceable proxy that should not weigh
 * the same as phosphorus or potassium.
 */
export const drawReference = (
  ctx: CanvasRenderingContext2D,
  area: Rect,
  scales: Scales,
  color: string,
  options: { band?: [number, number]; lines?: number[]; provisional?: boolean }
) => {
  const { band, lines = [], provisional } = options;

  if (band) {
    const y1 = scales.y(band[1]);
    const y2 = scales.y(band[0]);
    ctx.fillStyle = alpha(color, provisional ? 0.05 : 0.1);
    ctx.fillRect(area.left, y1, area.width, y2 - y1);
  }

  const bordes = band ? [band[0], band[1], ...lines] : lines;
  if (bordes.length === 0) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash(band ? [5, 5] : [3, 3]);
  ctx.beginPath();
  bordes.forEach((v) => {
    const y = Math.round(scales.y(v)) + 0.5;
    ctx.moveTo(area.left, y);
    ctx.lineTo(area.left + area.width, y);
  });
  ctx.stroke();
  ctx.restore();
};

/**
 * The series. Cut where the value is missing (the marks `breakGaps` left in the sensor's gaps);
 * joining them would draw a line over what nobody measured. Dots only with room to spare: with
 * thousands of readings they smear, and an isolated cluster is the only thing visible because a
 * one-point stretch forms no line.
 */
export const drawSeries = <T extends Point>(
  ctx: CanvasRenderingContext2D,
  scales: Scales,
  points: T[],
  key: string,
  color: string,
  withDots: boolean
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();

  let abierto = false;
  points.forEach((p) => {
    const v = valueOf(p, key);
    if (v === null) {
      abierto = false;
      return;
    }
    const x = scales.x(p.t);
    const y = scales.y(v);
    if (abierto) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
    abierto = true;
  });
  ctx.stroke();

  if (withDots) {
    ctx.fillStyle = color;
    points.forEach((p) => {
      const v = valueOf(p, key);
      if (v === null) return;
      ctx.beginPath();
      ctx.arc(scales.x(p.t), scales.y(v), 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
};

/**
 * The cursor: a vertical line at the pointed-at instant and a dot on the reading. On its OWN
 * canvas, over the data one, so hovering is cheap: sharing a canvas would repaint the whole
 * series on every move.
 */
export const drawCursor = (
  ctx: CanvasRenderingContext2D,
  area: Rect,
  scales: Scales,
  at: number,
  value: number | null,
  color: string,
  lineColor: string
) => {
  const x = Math.round(scales.x(at)) + 0.5;
  if (x < area.left || x > area.left + area.width) return;

  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x, area.top);
  ctx.lineTo(x, area.top + area.height);
  ctx.stroke();
  ctx.setLineDash([]);

  if (value !== null) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 0.5, scales.y(value), 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
};
