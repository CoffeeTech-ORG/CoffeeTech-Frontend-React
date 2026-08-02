import React, { useCallback, useMemo } from 'react';
import { Tooltip as AntTooltip } from 'antd';
import { Info } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';
import { ChartDataPoint } from '../../../types/report.types';
import { ReferenceMetric } from '../../../services/reference.service';
import { SERIES_COLORS } from '../../../styles/statusTokens';
import { MetricCanvas } from './canvas/MetricCanvas';
import {
  chipLabel,
  describeReference,
  observedFor,
  verdictFor,
  verdictTokens,
} from './referenceHelpers';

/** One decimal at most: the sensor returns 88.5714… next to integer mg/kg values. */
const formatReading = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/**
 * One of the two evidence lines: fixed label on the left, content to its right. The container
 * does not wrap; the body does, so the label always heads the first line. A single wrapping flex
 * lets each chunk break on its own, and at 390 px the "Modelo" pill lands alone on a middle line,
 * after what it labels.
 */
const Fact: React.FC<{ tag: string; model?: boolean; children: React.ReactNode }> = ({
  tag,
  model,
  children,
}) => (
  <p className="metric-row__fact">
    <span className={`metric-row__fact-tag${model ? ' is-model' : ''}`}>{tag}</span>
    <span className="metric-row__fact-body">{children}</span>
  </p>
);

/**
 * An indivisible datum with its separator ATTACHED BEHIND. Indivisible so "máximo 26.8 °C" does
 * not split across lines; the separator behind and not in front so a wrap does not start a line
 * with "·". `prose` is the exception for the engine's sentence, which is text and should wrap
 * inside.
 */
const Chunk: React.FC<{ last: boolean; prose?: boolean; children: React.ReactNode }> = ({
  last,
  prose,
  children,
}) => (
  <span className={`metric-row__chunk${prose ? ' is-prose' : ''}`}>
    {children}
    {last ? '' : ' ·'}
  </span>
);

export interface MetricSeries {
  filter: string;
  dataKey: string;
  refKey: 'N' | 'P' | 'K' | 'temperature' | 'air_humidity' | 'soil_humidity';
  color: string;
  labelKey: string;
}

interface MetricRowProps {
  item: MetricSeries;
  /** The engine's reference for this metric; `undefined` if the model did not answer. */
  metric: ReferenceMetric | undefined;
  /** Series already reduced and gap-marked: what gets drawn. */
  points: ChartDataPoint[];
  /** Full unreduced window: used to judge and to compute mean/min/max. */
  window: ChartDataPoint[];
  /** Vertical scale, fixed over the WHOLE period so it does not shift while panning. */
  domainY: [number, number] | undefined;
  width: number;
  height: number;
  last: boolean;
  domainX: [number, number] | undefined;
  ticksX: number[] | undefined;
  formatTick: (value: number) => string;
  /** Rain spans, already clipped to the window. */
  rain: Array<{ x1: number; x2: number }>;
  /** Minimum width of a rain span, in ms of this period. */
  rainMinWidth: number;
  /** Dots visible: only with room to spare, otherwise they blur into a smear. */
  dots: boolean;
  /** The marked instant, common to the six rows. */
  cursor: number | null;
  hovered: boolean;
  onCursor: (at: number | null) => void;
  onHover: (refKey: string | null) => void;
}

/**
 * One metric: its verdict, what was measured and its chart. A separate memoised component so that
 * pointing at a row repaints only the two that change; inline in `ReportChart`'s `map`, any
 * parent state (starting with which row has the cursor) re-renders all six rows and canvases.
 *
 * The three window-wide computations (verdict, axis domain, mean/min/max) are in `useMemo`:
 * moving the cursor changes a prop on every row, and without it each mouse move would repeat
 * eighteen passes over thousands of readings.
 */
const MetricRowBase: React.FC<MetricRowProps> = ({
  item,
  metric,
  points,
  window: ventana,
  domainY,
  width,
  height,
  last,
  domainX,
  ticksX,
  formatTick,
  rain,
  rainMinWidth,
  dots,
  cursor,
  hovered,
  onCursor,
  onHover,
}) => {
  const { t } = useI18n();
  const dataKey = item.dataKey as keyof ChartDataPoint;

  // Judged over the visible WINDOW, not the whole period: if the user zoomed into a stretch,
  // the verdict and mean/min/max should describe what is in front of them.
  const verdict = useMemo(() => verdictFor(metric, ventana, dataKey), [metric, ventana, dataKey]);
  const observed = useMemo(() => observedFor(ventana, dataKey), [ventana, dataKey]);

  /** The engine's reference, resolved to what to DRAW. */
  const referenceShapes = useMemo(() => {
    if (!metric) return {};
    if (metric.kind === 'band' && metric.optimal) {
      return { band: metric.optimal, provisional: metric.provisional };
    }
    if (metric.kind === 'threshold') {
      const lines = (metric.thresholds ?? [])
        .map((th) => th.above ?? th.below)
        .filter((v): v is number => v !== undefined);
      return { lines };
    }
    // `relative` (soil moisture): the engine gives no absolute band, so none is drawn. A fixed
    // percentage would be invented.
    return {};
  }, [metric]);

  const marcarHover = useCallback(
    (dentro: boolean) => onHover(dentro ? item.refKey : null),
    [onHover, item.refKey]
  );

  /**
   * Coverage is shown WHENEVER it can be computed, including 100 %. Hidden above 99.5 % it appears
   * only on the metric going wrong, reading as a fact exclusive to that row; the slot always in
   * the same place is what lets six rows be compared at a glance.
   */
  const coveragePct =
    verdict?.coverage !== null && verdict?.coverage !== undefined
      ? Math.round(verdict.coverage * 100)
      : null;

  /** What the engine SAYS about this metric: band, thresholds, or why there is no fixed range. */
  const referenceText = useMemo(
    () =>
      describeReference(metric, {
        from: t('reports.chart.thresholdFrom'),
        below: t('reports.chart.thresholdBelow'),
      }),
    [metric, t]
  );

  /** What a screen reader hears in place of the canvas, which is opaque to it. */
  const resumen = observed
    ? `${t(item.labelKey)}. ${t('reports.chart.observed')}: ${t('reports.chart.avg')} ${formatReading(
        observed.avg
      )}, ${t('reports.chart.min')} ${formatReading(observed.min)}, ${t(
        'reports.chart.max'
      )} ${formatReading(observed.max)}.`
    : t(item.labelKey);

  return (
    <div
      className="metric-row"
      style={{ marginBottom: last ? 0 : 18 }}
    >
      {/* Título y veredicto JUNTOS, a la izquierda. Separados a los extremos de la fila el chip
          quedaba flotando entre dos gráficos y no se sabía a cuál pertenecía: con 1900 px de
          vacío en medio, la proximidad es lo único que asocia. */}
      {/* Fila flex a mano, no el `Space` de antd. Espaciar cinco elementos es una línea de CSS;
          `Space` envuelve cada hijo en un div propio y hace ese trabajo en cada render, y aquí
          se re-renderiza en cada fotograma del arrastre. */}
      <div className="metric-row__head">
        <span className="metric-row__name">{t(item.labelKey)}</span>
        {verdict && (
          <span
            className="metric-row__verdict"
            style={{
              color: verdictTokens(verdict).fg,
              background: verdictTokens(verdict).bg,
              borderColor: verdictTokens(verdict).border,
            }}
          >
            {chipLabel(verdict.label)}
            {verdict.provisional ? ` · ${t('section.rec.tag.referential').toLowerCase()}` : ''}
          </span>
        )}
        {/* La última lectura, ROTULADA. Sin el rótulo era un número pegado a la píldora y se
            leía como parte de ella: nadie podía saber que «58.5 %» era el último dato de la
            ventana y no, por ejemplo, un porcentaje del periodo. */}
        {verdict && (
          <span className="metric-row__last">
            {t('reports.chart.lastReading')} <b>{formatReading(verdict.value)} {verdict.unit}</b>
          </span>
        )}
        {metric?.note && metric.kind !== 'relative' && (
          <AntTooltip title={metric.note} placement="right">
            <Info size={13} className="metric-row__note" />
          </AntTooltip>
        )}
      </div>

      {/* Qué significa la píldora, en las palabras del motor. «Hoja mojada» o «Calor agudo» no
          dicen nada a quien no conoce el modelo, y la frase que lo explica ya venía en la
          respuesta: la interfaz la descartaba. Sólo cuando el veredicto NO es el bueno — lo que
          está bien no necesita explicación, y una línea bajo cada métrica correcta sería ruido. */}
      {verdict && !verdict.inOptimal && verdict.explanation && (
        <p className="metric-row__why" style={{ color: verdictTokens(verdict).fg }}>
          {chipLabel(verdict.explanation)}
        </p>
      )}

      {/* ── Dos líneas fijas, y siempre las mismas ────────────────────────────────────────
          Lo que MIDIÓ el sensor y lo que ACEPTA el modelo, separados a propósito: confundirlos
          es el error que se quiere evitar. Y en el mismo orden en las seis filas, porque antes
          las ranuras aparecían y desaparecían según la métrica y no había forma de saber si una
          ausencia significaba «no tiene referencia» o «se nos olvidó». */}
      {observed && (
        <Fact tag={t('reports.chart.measuredIn')}>
          <Chunk last={false}>
            <b>
              {t('reports.chart.avg')} {formatReading(observed.avg)}
            </b>
          </Chunk>
          <Chunk last={false}>
            {t('reports.chart.min')} {formatReading(observed.min)}
          </Chunk>
          <Chunk last>
            {t('reports.chart.max')} {formatReading(observed.max)} {metric?.unit ?? ''}
          </Chunk>
        </Fact>
      )}

      {referenceText && (
        <Fact tag={t('reports.chart.model')} model>
          {referenceText.kind === 'band' && (
            <>
              <Chunk last={coveragePct === null}>
                {t('reports.chart.acceptedRange')} <b>{referenceText.range}</b>
              </Chunk>
              {coveragePct !== null && (
                <Chunk last>{t('reports.chart.coverInRange', { pct: String(coveragePct) })}</Chunk>
              )}
            </>
          )}

          {referenceText.kind === 'threshold' && (
            <>
              {/* Los umbrales, nombrados. El motor manda su etiqueta corta y su valor; hasta
                  ahora se dibujaban como líneas punteadas y nada decía qué eran. */}
              {referenceText.thresholds.map((texto, i) => (
                <Chunk key={texto} last={i === referenceText.thresholds.length - 1 && coveragePct === null}>
                  {texto}
                </Chunk>
              ))}
              {coveragePct !== null && (
                <Chunk last>{t('reports.chart.coverNoCross', { pct: String(coveragePct) })}</Chunk>
              )}
            </>
          )}

          {/* Sin rango fijo: se dice, con la razón que da el propio motor. Antes esta fila
              simplemente no tenía referencia y el hueco no se distinguía de un olvido.
              Es la ÚNICA pieza que envuelve por dentro: es una frase, no un dato. */}
          {referenceText.kind === 'relative' && (
            <Chunk last prose>
              <b>{t('reports.chart.noFixedRange')}</b>
              {referenceText.reason ? ` — ${referenceText.reason}` : ''}
            </Chunk>
          )}
        </Fact>
      )}

      {domainX && domainY && ticksX && width > 0 && (
        <MetricCanvas
          points={points}
          dataKey={item.dataKey}
          color={item.color}
          unit={metric?.unit ?? ''}
          label={resumen}
          width={width}
          height={height}
          domainX={domainX}
          domainY={domainY}
          ticksX={ticksX}
          formatTick={formatTick}
          reference={referenceShapes}
          rain={rain}
          rainMinWidth={rainMinWidth}
          rainColor={SERIES_COLORS.rain}
          dots={dots}
          cursor={cursor}
          hovered={hovered}
          onCursor={onCursor}
          onHover={marcarHover}
        />
      )}
    </div>
  );
};

export const MetricRow = React.memo(MetricRowBase);
