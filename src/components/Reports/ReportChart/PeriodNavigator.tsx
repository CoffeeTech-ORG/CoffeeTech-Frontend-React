import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useI18n } from '../../../contexts/I18nContext';
import { ChartDataPoint } from '../../../types/report.types';
import './PeriodNavigator.scss';

/** Density columns to draw. More than this adds nothing at 1100 px wide. */
const BUCKETS = 120;
/**
 * Grab zone of each edge, in PIXELS. A fraction of the total period breaks twice: it stops
 * matching the visible 9 px handle, and with a narrow window the two edges' zones overlap. In
 * pixels the grab is always what the eye sees, at any zoom.
 */
const HANDLE_PX = 11;

interface PeriodNavigatorProps {
  /** The whole queried period, unbounded. */
  data: ChartDataPoint[];
  /** Visible window, or null when the whole period is shown. */
  window: [number, number] | null;
  onChange: (window: [number, number] | null) => void;
}

type Grab = { mode: 'move' | 'from' | 'to'; offset: number };

/**
 * Where the readings are, and which stretch is being viewed. A visible control instead of a drag
 * gesture on the chart, which nobody can find, and it also shows WHERE to look when readings
 * cluster in stretches days apart (a silent hub, a period asked longer than what was measured):
 * the columns show where the readings are, the blanks are gaps.
 *
 * Not recharts' `Brush`: it works on chart-array indices, and here each of the six series is
 * reduced on its own so their indices differ. This works on instants, the only thing common to
 * all of them.
 */
export const PeriodNavigator: React.FC<PeriodNavigatorProps> = ({ data, window: ventana, onChange }) => {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  /**
   * What is being grabbed. In a REF, not just state: the `pointermove` handler is the one from the
   * last render, and in a fast drag React has not repainted between `pointerdown` and the first
   * move, so that handler would see `null` and drop the first movements. State is kept only for
   * the "grabbing" cursor.
   */
  const grabbed = useRef<Grab | null>(null);
  const [grab, setGrab] = useState<Grab | null>(null);
  // A drag fires many times a second; it accumulates in a ref and publishes once per frame.
  // Otherwise every pixel of movement re-renders the six rows.
  const pending = useRef<[number, number] | null>(null);
  const frame = useRef<number>();

  const [desde, hasta] = useMemo(() => {
    if (data.length === 0) return [0, 0];
    return [data[0].t, data[data.length - 1].t];
  }, [data]);

  const span = hasta - desde;

  /** How many readings fell in each column: the map of where the data is. */
  const density = useMemo(() => {
    const bins = new Array(BUCKETS).fill(0);
    if (span <= 0) return bins;
    data.forEach((point) => {
      const index = Math.min(BUCKETS - 1, Math.floor(((point.t - desde) / span) * BUCKETS));
      bins[index] += 1;
    });
    const top = Math.max(...bins);
    return top === 0 ? bins : bins.map((n) => n / top);
  }, [data, desde, span]);

  const [from, to] = ventana ?? [desde, hasta];
  const pct = (value: number) => (span <= 0 ? 0 : ((value - desde) / span) * 100);

  /**
   * Publishes the window at most once per frame. The first move publishes immediately, not next
   * frame: waiting adds a visible lag at the start, and in a tab that is not painting
   * `requestAnimationFrame` may never run so nothing would move at all. What is throttled is the
   * burst that follows.
   */
  const publish = useCallback(
    (next: [number, number]) => {
      pending.current = next;
      if (frame.current !== undefined) return;
      onChange(next);
      frame.current = requestAnimationFrame(() => {
        frame.current = undefined;
        if (pending.current && pending.current !== next) onChange(pending.current);
      });
    },
    [onChange]
  );

  useEffect(
    () => () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    []
  );

  const instantAt = (clientX: number): number => {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return desde;
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    return desde + ratio * span;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (span <= 0) return;
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;

    // Without this the browser starts its own selection drag over the bar's children: the
    // "no drop" cursor appears, the native drag keeps the pointer and our `pointermove` stop
    // arriving, so the window moves a little and freezes until a click cancels the browser drag.
    event.preventDefault();

    const at = instantAt(event.clientX);
    // The grab zone is converted from pixels to time with THIS bar's scale.
    const edge = (HANDLE_PX / box.width) * span;
    const aFrom = Math.abs(at - from);
    const aTo = Math.abs(at - to);

    let mode: Grab['mode'] = 'move';
    if (Math.min(aFrom, aTo) <= edge) {
      // The NEAREST edge, not the first zone entered: checking `from` first, a narrow window's
      // two zones overlap and the right edge cannot be grabbed.
      mode = aTo < aFrom ? 'to' : 'from';
    } else if (at < from || at > to) {
      // Click outside the window: move the window there, keeping its width.
      const width = to - from;
      const start = Math.min(Math.max(desde, at - width / 2), hasta - width);
      onChange([start, start + width]);
      return;
    }

    // A new gesture starts clean. If the previous one ended with no grab (a click that only moved
    // the window), `stop` returned before releasing the pending frame, so `publish` saw one in
    // flight and published nothing, and the old gesture's stored value applied on release.
    if (frame.current !== undefined) {
      cancelAnimationFrame(frame.current);
      frame.current = undefined;
    }
    pending.current = null;

    // The grab is stored BEFORE trying to capture the pointer. Capture is a convenience (events
    // keep arriving if the cursor leaves the bar), not a requirement, and it can throw. If it did,
    // the exception aborted the handler here and the drag died silently: `preventDefault` had
    // already run, so neither the browser nor we handled the gesture.
    const next = { mode, offset: at - (mode === 'to' ? to : from) };
    grabbed.current = next;
    setGrab(next);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Without capture the drag still works while the pointer is over the bar.
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const grab = grabbed.current;
    if (!grab) return;
    const at = instantAt(event.clientX) - grab.offset;
    // Window floor: below a minute there is nothing to look at and the axis degenerates.
    const min = Math.max(60_000, span / 500);

    if (grab.mode === 'move') {
      const width = to - from;
      const start = Math.min(Math.max(desde, at), hasta - width);
      publish([start, start + width]);
    } else if (grab.mode === 'from') {
      publish([Math.min(Math.max(desde, at), to - min), to]);
    } else {
      publish([from, Math.max(Math.min(hasta, at), from + min)]);
    }
  };

  const stop = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!grabbed.current) return;
    grabbed.current = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // If capture failed, there is nothing to release.
    }

    // Closes the burst on release: the last position applies and the pending frame is freed.
    // The final move usually lands inside the reserved frame, and if that frame never runs (a
    // backgrounded tab mid-drag) `frame` stays occupied for good and the mini-map stops
    // responding for the rest of the session.
    if (frame.current !== undefined) {
      cancelAnimationFrame(frame.current);
      frame.current = undefined;
    }
    if (pending.current) {
      onChange(pending.current);
      pending.current = null;
    }
    setGrab(null);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (span <= 0) return;
    const width = to - from;
    const stepSize = width / 4;
    if (event.key === 'ArrowLeft') {
      const start = Math.max(desde, from - stepSize);
      onChange([start, start + width]);
    } else if (event.key === 'ArrowRight') {
      const start = Math.min(hasta - width, from + stepSize);
      onChange([start, start + width]);
    } else if (event.key === 'Home' || event.key === 'Escape') {
      onChange(null);
    } else {
      return;
    }
    event.preventDefault();
  };

  if (data.length < 2 || span <= 0) return null;

  const label = `${dayjs(from).format('DD MMM HH:mm')} → ${dayjs(to).format('DD MMM HH:mm')}`;

  return (
    <div className="period-nav">
      <div className="period-nav__head">
        <span className="period-nav__hint">{t('reports.chart.nav.hint')}</span>
        {ventana && (
          <button type="button" className="period-nav__reset" onClick={() => onChange(null)}>
            {t('reports.chart.zoom.reset')}
          </button>
        )}
      </div>

      <div
        ref={track}
        className={`period-nav__track${grab ? ' is-grabbing' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
      >
        {/* Densidad de lecturas. Los blancos son silencio del hub, no ceros. */}
        <div className="period-nav__density" aria-hidden="true">
          {density.map((value, index) => (
            <i key={index} style={{ height: `${Math.max(value * 100, value > 0 ? 12 : 0)}%` }} />
          ))}
        </div>

        <div
          className="period-nav__window"
          role="slider"
          tabIndex={0}
          aria-label={t('reports.chart.nav.label')}
          aria-valuetext={label}
          aria-valuemin={desde}
          aria-valuemax={hasta}
          aria-valuenow={from}
          onKeyDown={onKeyDown}
          style={{ left: `${pct(from)}%`, width: `${pct(to) - pct(from)}%` }}
        >
          <i className="period-nav__handle period-nav__handle--from" aria-hidden="true" />
          <i className="period-nav__handle period-nav__handle--to" aria-hidden="true" />
        </div>
      </div>

      <div className="period-nav__axis">
        <span>{dayjs(desde).format('DD MMM')}</span>
        <span className="period-nav__current">{label}</span>
        <span>{dayjs(hasta).format('DD MMM')}</span>
      </div>
    </div>
  );
};
