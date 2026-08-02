import React, { useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { ChartDataPoint } from '../../../../types/report.types';
import { formatTickValue, niceTicks } from './niceTicks';
import {
  PLOT_PADDING,
  Rect,
  drawCursor,
  drawGrid,
  drawRain,
  drawReference,
  drawSeries,
  prepare,
  scalesFor,
} from './draw';
import './MetricCanvas.scss';

interface MetricCanvasProps {
  points: ChartDataPoint[];
  dataKey: string;
  color: string;
  unit: string;
  /** Metric name, for the tooltip and the text alternative. */
  label: string;
  width: number;
  height: number;
  domainX: [number, number];
  domainY: [number, number];
  ticksX: number[];
  formatTick: (value: number) => string;
  reference: { band?: [number, number]; lines?: number[]; provisional?: boolean };
  rain: Array<{ x1: number; x2: number }>;
  rainMinWidth: number;
  rainColor: string;
  dots: boolean;
  /** The marked instant, shared by all rows. */
  cursor: number | null;
  /** true only on the row with the pointer: the one showing the tooltip. */
  hovered: boolean;
  onCursor: (at: number | null) => void;
  onHover: (hovered: boolean) => void;
}

/** Reading nearest an instant. The series is sorted, so this is a binary search. */
const nearest = (points: ChartDataPoint[], key: string, at: number): ChartDataPoint | null => {
  if (points.length === 0) return null;
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].t < at) lo = mid + 1;
    else hi = mid;
  }
  const candidatos = [points[lo - 1], points[lo]].filter(Boolean);
  const conValor = candidatos.filter((p) => typeof (p as never)[key] === 'number');
  if (conValor.length === 0) return null;
  return conValor.reduce((mejor, p) =>
    Math.abs(p.t - at) < Math.abs(mejor.t - at) ? p : mejor
  );
};

/**
 * A metric's plot area, drawn on canvas. Two canvases, not one: the DATA canvas repaints on
 * window, series or size changes; the CURSOR canvas on every mouse move. Sharing one would
 * redraw the whole series per move. Axis labels and the tooltip are HTML above the canvas: real
 * text, selectable, translatable and readable by a screen reader.
 */
export const MetricCanvas: React.FC<MetricCanvasProps> = ({
  points,
  dataKey,
  color,
  unit,
  label,
  width,
  height,
  domainX,
  domainY,
  ticksX,
  formatTick,
  reference,
  rain,
  rainMinWidth,
  rainColor,
  dots,
  cursor,
  hovered,
  onCursor,
  onHover,
}) => {
  const capaDatos = useRef<HTMLCanvasElement>(null);
  const capaCursor = useRef<HTMLCanvasElement>(null);

  const area: Rect = useMemo(
    () => ({
      left: PLOT_PADDING.left,
      top: PLOT_PADDING.top,
      width: Math.max(0, width - PLOT_PADDING.left - PLOT_PADDING.right),
      height: Math.max(0, height - PLOT_PADDING.top - PLOT_PADDING.bottom),
    }),
    [width, height]
  );

  const scales = useMemo(() => scalesFor(area, domainX, domainY), [area, domainX, domainY]);
  const ticksY = useMemo(() => niceTicks(domainY[0], domainY[1]), [domainY]);

  // Data layer.
  useEffect(() => {
    const canvas = capaDatos.current;
    if (!canvas || width <= 0 || area.width <= 0) return;
    const ctx = prepare(canvas, width, height);
    if (!ctx) return;

    drawRain(ctx, area, scales, rain, rainMinWidth, rainColor);
    drawGrid(ctx, area, scales, ticksX, ticksY, 'rgba(0,0,0,0.09)');
    drawReference(ctx, area, scales, color, reference);
    drawSeries(ctx, scales, points, dataKey, color, dots);
  }, [
    points, dataKey, color, width, height, area, scales, ticksX, ticksY,
    reference, rain, rainMinWidth, rainColor, dots,
  ]);

  const señalada = useMemo(
    () => (cursor === null ? null : nearest(points, dataKey, cursor)),
    [cursor, points, dataKey]
  );

  // Capa de cursor.
  useEffect(() => {
    const canvas = capaCursor.current;
    if (!canvas || width <= 0 || area.width <= 0) return;
    const ctx = prepare(canvas, width, height);
    if (!ctx || cursor === null) return;

    const valor = señalada ? (señalada[dataKey as keyof ChartDataPoint] as number) : null;
    drawCursor(ctx, area, scales, cursor, valor ?? null, color, 'rgba(0,0,0,0.35)');
  }, [cursor, señalada, dataKey, area, scales, width, height, color]);

  const instanteEn = (clientX: number): number => {
    const box = capaDatos.current?.getBoundingClientRect();
    if (!box || area.width <= 0) return domainX[0];
    const ratio = (clientX - box.left - area.left) / area.width;
    return domainX[0] + Math.min(1, Math.max(0, ratio)) * (domainX[1] - domainX[0]);
  };

  const valorSeñalado =
    señalada && typeof señalada[dataKey as keyof ChartDataPoint] === 'number'
      ? (señalada[dataKey as keyof ChartDataPoint] as number)
      : null;

  // Tooltip position: sticks to the cursor but stays inside the canvas.
  const tooltipX = cursor === null ? 0 : Math.min(Math.max(scales.x(cursor), area.left), area.left + area.width);
  const tooltipDerecha = tooltipX > area.left + area.width / 2;

  return (
    <div
      className="metric-canvas"
      style={{ height }}
      onPointerMove={(e) => onCursor(instanteEn(e.clientX))}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => {
        onHover(false);
        onCursor(null);
      }}
    >
      <canvas
        ref={capaDatos}
        className="metric-canvas__layer"
        style={{ width, height }}
        role="img"
        aria-label={label}
      />
      <canvas
        ref={capaCursor}
        className="metric-canvas__layer metric-canvas__layer--cursor"
        style={{ width, height }}
        aria-hidden="true"
      />

      {/* Etiquetas de los ejes. Van en HTML para que sigan siendo texto.

          La `key` es la POSICIÓN, no el valor: son casillas de un eje, no entidades. Con el
          valor como clave, cada cambio de ventana daba claves nuevas y React desmontaba y
          volvía a crear los ocho nodos en vez de reescribir su texto. */}
      {ticksY.map((v, i) => (
        <span
          key={i}
          className="metric-canvas__ytick"
          style={{ top: scales.y(v), width: PLOT_PADDING.left - 6 }}
          aria-hidden="true"
        >
          {formatTickValue(v, ticksY)}
        </span>
      ))}

      {ticksX.map((t, i) => (
        <span
          key={i}
          className="metric-canvas__xtick"
          style={{
            left: scales.x(t),
            // The first and last sit against their edge rather than centred, or they overflow
            // the canvas.
            transform:
              i === 0 ? 'none' : i === ticksX.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
          }}
          aria-hidden="true"
        >
          {formatTick(t)}
        </span>
      ))}

      {hovered && cursor !== null && señalada && (
        <div
          className={`metric-canvas__tip${tooltipDerecha ? ' is-left' : ''}`}
          style={{ left: tooltipX }}
          role="status"
        >
          <span className="metric-canvas__tip-when">
            {dayjs(señalada.t).format('DD MMM YYYY · HH:mm')}
          </span>
          <span className="metric-canvas__tip-value" style={{ color }}>
            {valorSeñalado === null
              ? '—'
              : `${Number.isInteger(valorSeñalado) ? valorSeñalado : valorSeñalado.toFixed(1)} ${unit}`}
          </span>
        </div>
      )}
    </div>
  );
};
