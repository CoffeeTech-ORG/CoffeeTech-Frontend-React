import React from 'react';
import { ReportData, ChartDataPoint } from '../../../types/report.types';
import { ReferenceRanges } from '../../../services/reference.service';
import { coverageOk } from '../ReportChart/referenceHelpers';
import { useI18n } from '../../../contexts/I18nContext';
import { STATUS_TOKENS } from '../../../styles/statusTokens';
import './ReportStats.scss';

interface ReportStatsProps {
  data: ReportData[];
  chartData: ChartDataPoint[];
  reference: ReferenceRanges | null;
  /** Days the requested range spans, for the time-coverage percentage. */
  daysRequested: number;
  /** Engine alerts in the period. `null` = could not be queried. */
  alerts: number | null;
}

/** Metrics with a band in the model. Soil moisture is absent: the engine gives it none. */
const BANDED: Array<{ key: keyof ReferenceRanges['metrics']; dataKey: keyof ChartDataPoint }> = [
  { key: 'temperature', dataKey: 'temperature' },
  { key: 'N', dataKey: 'nitrogen' },
  { key: 'P', dataKey: 'phosphorus' },
  { key: 'K', dataKey: 'potassium' },
];

/**
 * The five figures that summarise the period.
 *
 * The strip's rule: NONE is invented. If a number cannot be computed -- because the model did not
 * answer or the history could not be queried -- the card says so with a dash instead of showing a
 * zero, which would read as "there were none".
 *
 * The `ReportSummary` it replaces carried its own agronomic ranges table (18-25 °C, 70-80 % ...)
 * contradicting the engine: the same bug already fixed once in the chart.
 */
export const ReportStats: React.FC<ReportStatsProps> = ({
  data,
  chartData,
  reference,
  daysRequested,
  alerts,
}) => {
  const { t } = useI18n();

  // Time in band: mean coverage of the metrics that DO have a band. With no model reference there is
  // nothing to measure against, so the card stays quiet.
  //
  // `coverageOk` also knows about thresholds, but this card still asks only for `BANDED`: "time in
  // band" means band, and mixing in air humidity -- which has none -- would change what the figure
  // says without warning.
  const coverages = reference
    ? BANDED.map((m) => coverageOk(reference.metrics[m.key], chartData, m.dataKey)).filter(
        (c): c is number => c !== null
      )
    : [];
  const enBanda =
    coverages.length > 0
      ? Math.round((coverages.reduce((a, b) => a + b, 0) / coverages.length) * 100)
      : null;

  const diaDe = (row: ReportData) => new Date(row.timestamp).toISOString().slice(0, 10);

  const diasConLluvia = new Set(
    data
      .filter(
        (r) =>
          r.precipitationDetected === 1 ||
          r.precipitationDetected === true ||
          r.precipitationDetected === '1'
      )
      .map(diaDe)
  ).size;

  // Time coverage: days of the range with at least one reading. It answers "was it measuring the
  // whole month or just three days?", which is different from the number of readings.
  const diasConDatos = new Set(data.map(diaDe)).size;
  const uptime =
    daysRequested > 0 ? Math.min(100, Math.round((diasConDatos / daysRequested) * 100)) : null;

  const tarjetas = [
    {
      key: 'readings',
      label: t('reports.stats.readings'),
      value: data.length.toLocaleString(),
      hint: t('reports.stats.readings.hint'),
    },
    {
      key: 'inBand',
      label: t('reports.stats.inBand'),
      value: enBanda === null ? '—' : `${enBanda}%`,
      hint: enBanda === null ? t('reports.stats.inBand.noModel') : t('reports.stats.inBand.hint'),
      color: enBanda === null ? undefined : STATUS_TOKENS.ok.fg,
    },
    {
      key: 'rain',
      label: t('reports.stats.rainDays'),
      value: String(diasConLluvia),
      hint: t('reports.stats.rainDays.hint'),
    },
    {
      key: 'alerts',
      label: t('reports.stats.alerts'),
      value: alerts === null ? '—' : String(alerts),
      hint: alerts === null ? t('reports.stats.alerts.unavailable') : t('reports.stats.alerts.hint'),
      color: alerts ? STATUS_TOKENS.alert.fg : undefined,
    },
    {
      key: 'uptime',
      label: t('reports.stats.uptime'),
      value: uptime === null ? '—' : `${uptime}%`,
      hint: t('reports.stats.uptime.hint', { days: diasConDatos, total: daysRequested }),
    },
  ];

  return (
    <div className="report-stats">
      {tarjetas.map((c) => (
        <div key={c.key} className="report-stats__card">
          <span className="report-stats__label">{c.label}</span>
          <span className="report-stats__value" style={c.color ? { color: c.color } : undefined}>
            {c.value}
          </span>
          <span className="report-stats__hint">{c.hint}</span>
        </div>
      ))}
    </div>
  );
};
