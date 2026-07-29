import React, { useEffect, useState } from 'react';
import { ChevronDown, RefreshCw, HelpCircle } from 'lucide-react';
import { DataRecord } from '../../types/api.types';
import { useI18n } from '../../contexts/I18nContext';
import { useReferenceRanges } from '../../hooks/useReferenceRanges';
import { ReferenceMetric } from '../../services/reference.service';
import { judgeValue, chipLabel } from '../Reports/ReportChart/referenceHelpers';
import { STATUS_TOKENS, StatusTone, toneFor } from '../../styles/statusTokens';
import './SensorPanel.scss';

interface SensorPanelProps {
  data?: DataRecord | null;
  /** The section's stage: the engine's bands change with it. */
  stageName?: string;
  /** "3 min ago" -- when the reading being shown was taken. */
  lastReadingLabel?: string | null;
  /** When the next poll runs (epoch ms). The countdown is kept in here. */
  nextRefreshAt?: number | null;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/**
 * The sensor state, already judged. Each variable is classified against the SAME band the engine
 * applies (`GET /reference-ranges`), never a table written by hand in the front end, so this view
 * and the diagnosis cannot contradict each other. Seven raw numbers alone would leave the reader
 * scrolling to the recommendations to learn whether 98 mg/kg of potassium is good or bad.
 *
 * Three states per variable:
 *   · in its band          -> green
 *   · out of band          -> amber or terracotta, per the engine
 *   · no reliable datum     -> grey. The sensor is outside its calibrated domain, where the engine
 *                              does not prescribe either: neither "good" nor "bad".
 */

type TileState = StatusTone | 'unknown' | 'plain';

interface Tile {
  key: string;
  label: string;
  value: string;
  unit: string;
  state: TileState;
  chip?: string;
}

const fmt = (v: number | null | undefined, digits = 1): string | null =>
  v === null || v === undefined || Number.isNaN(v) ? null : v.toFixed(digits);

export const SensorPanel: React.FC<SensorPanelProps> = ({
  data,
  stageName,
  lastReadingLabel,
  nextRefreshAt,
  refreshing = false,
  onRefresh,
}) => {
  const { t } = useI18n();
  const ranges = useReferenceRanges(stageName);
  const [open, setOpen] = useState(true);

  // The countdown lives here and not in the hook on purpose: ticking once a second repaints this
  // panel, not the whole screen (which includes the diagnosis and the log).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!open || !nextRefreshAt) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [open, nextRefreshAt]);

  if (!data) {
    return (
      <section className="sensor-panel">
        <h4 className="sensor-panel__title">{t('section.sensor.title')}</h4>
        <p className="sensor-panel__empty">{t('cardData.noData')}</p>
      </section>
    );
  }

  /** Outside the calibrated domain: the engine stays silent, and the UI must too. */
  const outOfDomain = (metric: ReferenceMetric | undefined, value: number): boolean =>
    !!metric?.domain && (value < metric.domain[0] || value > metric.domain[1]);

  const tile = (
    key: string,
    labelKey: string,
    value: number | null | undefined,
    metric: ReferenceMetric | undefined,
    unit: string,
    digits = 1
  ): Tile | null => {
    const shown = fmt(value, digits);
    if (shown === null) return null;

    const base: Tile = {
      key,
      label: t(labelKey),
      value: shown,
      unit,
      state: 'plain',
    };

    // With no model available there is no verdict: the bare number is shown.
    if (!metric) return base;

    const verdict = judgeValue(metric, Number(value));

    if (!verdict) {
      // `relative` (soil moisture) has no band on purpose: the engine derives the threshold from
      // each plot's wet-dry envelope, so an absolute percentage is not judged.
      if (metric.kind === 'relative') return base;
      if (outOfDomain(metric, Number(value))) {
        return { ...base, state: 'unknown', chip: t('section.sensor.unreliable') };
      }
      return base;
    }

    const label =
      metric.kind === 'threshold' && verdict.inOptimal
        ? t('section.sensor.noAlert')
        : chipLabel(verdict.label);

    return {
      ...base,
      state: toneFor(verdict.severity, verdict.inOptimal),
      chip: label,
    };
  };

  const m = ranges?.metrics;
  const tiles = [
    tile('temp', 'cardData.temperature', data.celciusGradeTemperature, m?.temperature, '°C'),
    tile('air', 'cardData.airHumidity', data.airHumidityPercent, m?.air_humidity, '%', 0),
    tile('soil', 'cardData.soilHumidity', data.soilHumidityPercent, m?.soil_humidity, '%', 0),
    tile('n', 'cardData.nitrogen', data.nitrogen, m?.N, 'mg/kg', 0),
    tile('p', 'cardData.phosphorus', data.phosphorus, m?.P, 'mg/kg', 0),
    tile('k', 'cardData.potassium', data.potassium, m?.K, 'mg/kg', 0),
  ].filter((x): x is Tile => x !== null);

  const rained =
    data.precipitationDetected === 1 ||
    data.precipitationDetected === true ||
    data.precipitationDetected === '1';

  const unreliable = tiles.filter((x) => x.state === 'unknown');
  const secondsLeft = nextRefreshAt
    ? Math.max(0, Math.round((nextRefreshAt - now) / 1000))
    : null;
  const countdown =
    secondsLeft === null
      ? null
      : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  const toneStyle = (state: TileState) => {
    if (state === 'plain') return undefined;
    const token = state === 'unknown' ? STATUS_TOKENS.neutral : STATUS_TOKENS[state];
    return { color: token.fg, background: token.bg, borderColor: token.border };
  };

  return (
    <section className={`sensor-panel${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="sensor-panel__head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="sensor-panel__live" aria-hidden="true" />
        <h4 className="sensor-panel__title">{t('section.sensor.title')}</h4>
        {countdown && (
          <span className="sensor-panel__countdown">
            {t('section.sensor.nextIn', { time: countdown })}
          </span>
        )}
        <ChevronDown size={18} className="sensor-panel__chev" />
      </button>

      {open && (
        <>
          <p className="sensor-panel__cadence">
            {t('section.sensor.cadence')}
            {lastReadingLabel ? ` · ${t('section.sensor.seen', { when: lastReadingLabel })}` : ''}
          </p>

          <div className="sensor-panel__grid">
            {tiles.map((x) => (
              <div key={x.key} className={`sensor-tile is-${x.state}`} style={toneStyle(x.state)}>
                <span className="sensor-tile__label">{x.label}</span>
                <span className="sensor-tile__value">
                  {x.value}
                  <span className="sensor-tile__unit">{x.unit}</span>
                </span>
                {x.chip && (
                  <span className="sensor-tile__chip">
                    {x.state === 'unknown' && <HelpCircle size={12} />}
                    {x.chip}
                  </span>
                )}
              </div>
            ))}

            {/* La lluvia es un sí/no del FC-37, no una magnitud: sin banda ni veredicto. */}
            <div className="sensor-tile is-plain">
              <span className="sensor-tile__label">{t('cardData.precipitation')}</span>
              <span className="sensor-tile__value sensor-tile__value--text">
                {rained ? t('common.yes') : t('common.no')}
              </span>
            </div>
          </div>

          {unreliable.length > 0 && (
            <p className="sensor-panel__note">
              <strong>
                {unreliable.map((x) => x.label).join(', ')} · {t('section.sensor.unreliable')}:
              </strong>{' '}
              {t('section.sensor.unreliableNote')}
            </p>
          )}

          {!ranges && <p className="sensor-panel__note">{t('section.sensor.noReference')}</p>}

          {onRefresh && (
            <button
              type="button"
              className="sensor-panel__refresh"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? 'is-spinning' : undefined} />
              {t('common.refresh')}
            </button>
          )}
        </>
      )}
    </section>
  );
};

export default SensorPanel;
