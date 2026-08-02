import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import { Card, Radio, Row, Col, Typography, Space, Switch, Tooltip as AntTooltip } from 'antd';
import { useI18n } from '../../../contexts/I18nContext';
import { ChartDataPoint } from '../../../types/report.types';
import {
  referenceService,
  GrowthStage,
  ReferenceRanges,
} from '../../../services/reference.service';
import { axisDomainFor, rainSpans } from './referenceHelpers';
import { SERIES_COLORS } from '../../../styles/statusTokens';
import {
  breakGaps,
  downsampleLTTB,
  gapRatio,
  sensorRhythm,
  sliceByTime,
} from '../../../utils/downsample';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { MetricRow, MetricSeries } from './MetricRow';
import { PeriodNavigator } from './PeriodNavigator';
import './ReportChart.scss';

const { Title } = Typography;

interface ReportChartProps {
  data: ChartDataPoint[];
  dataType: 'all' | 'environmental' | 'soil' | 'nutrients';
  /** Crop stage: the engine tightens some bands with it (K during maduracion). */
  growthStage?: GrowthStage;
  style?: React.CSSProperties;
}

// Line only, for every data type. Bars need a 0 baseline, and 0 means nothing for temperature
// or for a soil concentration that never reads 0 mg/kg. From the reference instead, the bar
// heights misstate the ratio: 20 °C and 22 °C differ by 10 %, their bars by 30 %.
type NutrientFilter = 'all' | 'nitrogen' | 'phosphorus' | 'potassium';
type EnvironmentalFilter = 'all' | 'temperature' | 'airHumidity';

/**
 * Colour comes from `SERIES_COLORS`, never from a literal. Green, amber and terracotta are
 * reserved for state (the verdict chips), so a series must not use them.
 */
const NUTRIENT_SERIES: readonly MetricSeries[] = [
  { filter: 'nitrogen', dataKey: 'nitrogen', refKey: 'N', color: SERIES_COLORS.N, labelKey: 'reports.chart.nitrogen' },
  { filter: 'phosphorus', dataKey: 'phosphorus', refKey: 'P', color: SERIES_COLORS.P, labelKey: 'reports.chart.phosphorus' },
  { filter: 'potassium', dataKey: 'potassium', refKey: 'K', color: SERIES_COLORS.K, labelKey: 'reports.chart.potassium' },
];

const ENVIRONMENTAL_SERIES: readonly MetricSeries[] = [
  { filter: 'temperature', dataKey: 'temperature', refKey: 'temperature', color: SERIES_COLORS.temperature, labelKey: 'reports.chart.temperature' },
  { filter: 'airHumidity', dataKey: 'airHumidity', refKey: 'air_humidity', color: SERIES_COLORS.humidity, labelKey: 'reports.chart.airHumidity' },
];

const SOIL_SERIES: readonly MetricSeries[] = [
  { filter: 'soilHumidity', dataKey: 'soilHumidity', refKey: 'soil_humidity', color: SERIES_COLORS.soilMoisture, labelKey: 'reports.chart.soilHumidity' },
];

/** Order: the air first, then the soil, then what gets corrected with inputs. */
const ALL_SERIES: readonly MetricSeries[] = [
  ...ENVIRONMENTAL_SERIES,
  ...SOIL_SERIES,
  ...NUTRIENT_SERIES,
];

/** Row height by row count: six rows share the screen, one alone can be taller. */
const rowHeight = (rows: number): number => {
  if (rows <= 1) return 220;
  if (rows === 2) return 175;
  if (rows === 3) return 140;
  return 105;
};

/**
 * Metrics the engine reads together with rain: soil moisture (irrigation is suppressed after rain
 * in 24 h), air humidity (leaf wetness = RH >= 90 % or rain) and nitrogen (it leaches). Rain
 * explains nothing in P, K or temperature, so the switch starts off there.
 */
const RAIN_RELEVANT: Record<string, boolean> = {
  all: true,
  soil: true,
  environmental: true,
  nutrients: false,
};

/** Width taken by the Y axis and the margins; what is left is the canvas points fit into. */
const CHART_CHROME_PX = 80;
/** Floor, so a container that has not been measured yet cannot cut the series to four points. */
const MIN_POINTS = 120;
/** Pixels per reading above which the dot is drawn on top of the line. */
const PX_PER_DOT = 8;

/** Time-axis format by span: six hours on screen need the clock, three months need the date. */
const tickFormatterFor = (spanMs: number) => {
  const horas = spanMs / 3_600_000;
  if (horas <= 48) return (v: number) => dayjs(v).format('HH:mm');
  if (horas <= 24 * 120) return (v: number) => dayjs(v).format('DD MMM');
  return (v: number) => dayjs(v).format('MMM YY');
};

export const ReportChart: React.FC<ReportChartProps> = ({ data, dataType, growthStage, style }) => {
  const { t } = useI18n();
  const esMovil = useIsMobile();
  const [nutrientFilter, setNutrientFilter] = useState<NutrientFilter>('all');
  const [environmentalFilter, setEnvironmentalFilter] = useState<EnvironmentalFilter>('all');
  // Rain is a switch, not a chart type: the type says how to draw, rain says what to include.
  // One selector for both would force choosing between them.
  const [showRain, setShowRain] = useState<boolean>(RAIN_RELEVANT[dataType] ?? false);
  // Which row the pointer is over: only that one shows its value box. It goes through
  // `useCallback` because it travels into a memoised component.
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const onHover = useCallback((refKey: string | null) => setHoveredRow(refKey), []);

  /**
   * The pointed-at instant, shared by all six rows. Each row repaints only its cursor layer, not
   * its series, so the vertical line across all of them costs microseconds.
   */
  const [cursor, setCursor] = useState<number | null>(null);
  const onCursor = useCallback((at: number | null) => setCursor(at), []);

  // Reference ranges come from the diagnosis engine; no copy is kept here. If it does not
  // answer, `reference` stays null and no band is drawn rather than one that could contradict
  // the diagnosis.
  const [reference, setReference] = useState<ReferenceRanges | null>(null);

  useEffect(() => {
    let cancelled = false;
    referenceService.getReferenceRanges(growthStage).then((ranges) => {
      if (!cancelled) setReference(ranges);
    });
    return () => {
      cancelled = true;
    };
  }, [growthStage]);

  useEffect(() => {
    setShowRain(RAIN_RELEVANT[dataType] ?? false);
  }, [dataType]);

  // ── How many points fit ────────────────────────────────────────────────────────────────
  // The sensor reads every 2 min, so two weeks are 10 000 readings for at most ~1000 px. The
  // reduction is done here, against the measured container, instead of letting the browser
  // stack readings onto the same pixel.
  //
  // CALLBACK ref, not `useRef` + `useEffect`. With no data this component returns the "no data"
  // card, which never mounts the container, so an effect with empty deps runs once, finds the
  // ref empty and never runs again: the width stays 0 and a 1100 px screen gets 120 points.
  const [ancho, setAncho] = useState(0);
  const observador = useRef<ResizeObserver | null>(null);

  const contenedor = useCallback((nodo: HTMLDivElement | null) => {
    observador.current?.disconnect();
    if (!nodo) return;
    // Measure on mount. `ResizeObserver` fires inside the browser's rendering steps, so in a
    // tab that is not painting it may never arrive and the width would stay 0.
    setAncho(Math.round(nodo.getBoundingClientRect().width));
    observador.current = new ResizeObserver(([entrada]) =>
      setAncho(Math.round(entrada.contentRect.width))
    );
    observador.current.observe(nodo);
  }, []);

  useEffect(() => () => observador.current?.disconnect(), []);

  const objetivo = Math.max(MIN_POINTS, ancho - CHART_CHROME_PX);

  /**
   * How often the sensor reads. From the complete series, once: per window it would be eight
   * sorts of thousands of intervals per drag frame, and the threshold for "this is a gap" would
   * shift as you zoom.
   */
  const ritmo = useMemo(() => sensorRhythm(data), [data]);

  /**
   * Each metric's Y-axis domain, computed over the COMPLETE PERIOD and not over the visible
   * window.
   *
   * A scale recomputed per window prevents comparison: the line rises and falls as you pan
   * without the data changing, and the model band drifts even though it is a fixed reference.
   * It is also six passes over thousands of readings per drag frame.
   *
   * The trade-off: zoomed into a quiet stretch, small variation is not magnified.
   */
  const dominiosY = useMemo(() => {
    const salida: Record<string, [number, number] | undefined> = {};
    ALL_SERIES.forEach((s) => {
      salida[s.dataKey] = axisDomainFor(
        reference?.metrics?.[s.refKey],
        data,
        s.dataKey as keyof ChartDataPoint
      );
    });
    return salida;
  }, [data, reference]);

  // ── The visible window ─────────────────────────────────────────────────────────────────
  // Chosen with the mini-map below. Dragging on the chart itself is an invisible gesture and
  // re-renders all six rows on every `mousemove`.
  const [zoom, setZoom] = useState<[number, number] | null>(null);

  // A new query brings another period; the old window would point at nothing in it.
  useEffect(() => setZoom(null), [data]);

  // No `useDeferredValue`: it buys a responsive mini-map at the price of charts lagging behind
  // it, and only pays off when a repaint costs hundreds of ms. On the canvas it costs tenths.
  const ventana = useMemo(
    () => (zoom ? sliceByTime(data, zoom[0], zoom[1]) : data),
    [data, zoom]
  );

  /** X-axis extremes. Shared by every row, so the synchronised cursor lines up. */
  const dominioX: [number, number] | undefined = useMemo(() => {
    if (zoom) return zoom;
    if (ventana.length === 0) return undefined;
    const [desde, hasta] = [ventana[0].t, ventana[ventana.length - 1].t];
    // A period of zero width (every reading at the same instant) leaves the axis with no scale.
    // One minute of width keeps the scale valid; the readings stack into a vertical.
    return desde === hasta ? [desde - 30_000, hasta + 30_000] : [desde, hasta];
  }, [zoom, ventana]);

  /**
   * Axis ticks, spread evenly across the drawn period.
   *
   * The domain is divided, not the data. Dividing by datum yields one tick per point when
   * readings crowd into a few instants: thirty-two identical labels on the same pixel.
   */
  const marcasX: number[] | undefined = useMemo(() => {
    if (!dominioX) return undefined;
    const [desde, hasta] = dominioX;
    if (hasta <= desde) return [desde];
    // Four dates fit a desktop chart; on the phone they would overlap.
    const cuantas = ancho > 700 ? 4 : 3;
    const marcas = Array.from({ length: cuantas }, (_, i) =>
      Math.round(desde + ((hasta - desde) * i) / (cuantas - 1))
    );
    // No duplicates: in a window of a few ms the rounding merges them into the same pixel.
    return [...new Set(marcas)];
  }, [dominioX, ancho]);

  const formatTick = useMemo(
    () => tickFormatterFor(dominioX ? dominioX[1] - dominioX[0] : 0),
    [dominioX]
  );

  /**
   * Already-reduced series, per metric.
   *
   * All six at once rather than inside the rows' `map`, because a hook cannot live in a loop.
   * Each series is reduced on its own: nitrogen's peak and temperature's fall in different
   * minutes, and picking one series' points from another would drop them.
   */
  const seriesReducidas = useMemo(() => {
    const salida: Record<string, { puntos: ChartDataPoint[]; lecturas: number }> = {};
    ALL_SERIES.forEach((s) => {
      const clave = s.dataKey as keyof ChartDataPoint;
      // Empties are dropped before reducing; counting them as 0 invents drops the sensor never
      // measured. `breakGaps` marks the gap again afterwards.
      const medidos = ventana.filter((p) => typeof p[clave] === 'number');
      const elegidos = downsampleLTTB(medidos, clave, objetivo);
      // Counted before the gaps are marked: the breaks are drawing marks, not readings.
      salida[s.dataKey] = {
        puntos: breakGaps(elegidos, clave, ritmo),
        lecturas: elegidos.length,
      };
    });
    return salida;
  }, [ventana, objetivo, ritmo]);

  const lluvia = useMemo(
    () => (showRain ? rainSpans(ventana, ritmo) : []),
    [showRain, ventana, ritmo]
  );

  /**
   * Minimum width of a rain span, in milliseconds of this period.
   *
   * A twenty-minute shower inside two weeks is 0.05 px. The minimum lives here and not in
   * `rainSpans` because it depends on the pixel count, and that function must not exaggerate a
   * duration.
   */
  const anchoMinimoLluvia = dominioX ? (dominioX[1] - dominioX[0]) / 360 : 0;

  /** Fraction of the drawn period with no reading at all. */
  const vacio = useMemo(() => gapRatio(ventana, ritmo), [ventana, ritmo]);

  if (data.length === 0) {
    return (
      <Card title={t('reports.chart.title')} style={style}>
        <div className="metric-row__nodata">{t('reports.chart.noData')}</div>
      </Card>
    );
  }

  const metrics = reference?.metrics;

  /**
   * Which rows get drawn: one shape for all four data types. A shared axis across metrics puts
   * temperature (19-25 °C) and air humidity (70-99 %) on one 0-100 scale, which flattens
   * temperature against the floor and makes its band unreadable.
   */
  const visibleSeries = (): readonly MetricSeries[] => {
    if (dataType === 'nutrients') {
      return NUTRIENT_SERIES.filter((s) => nutrientFilter === 'all' || nutrientFilter === s.filter);
    }
    if (dataType === 'environmental') {
      return ENVIRONMENTAL_SERIES.filter(
        (s) => environmentalFilter === 'all' || environmentalFilter === s.filter
      );
    }
    if (dataType === 'soil') return SOIL_SERIES;
    return ALL_SERIES;
  };

  const series = visibleSeries();
  const alto = rowHeight(series.length);
  // How many readings are actually drawn: the maximum across the visible series.
  const dibujadas = series.reduce(
    (max, s) => Math.max(max, seriesReducidas[s.dataKey]?.lecturas ?? 0),
    0
  );
  const reduciendo = ventana.length > dibujadas;
  // With room to spare the dot is drawn: an isolated cluster forms no line and would not show.
  // With thousands of readings it turns itself off.
  const conPuntos = dibujadas > 0 && ancho / dibujadas >= PX_PER_DOT;

  return (
    <Card
      title={
        <Row justify="space-between" align="middle" gutter={[8, 8]}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {t('reports.chart.title')}
            </Title>
          </Col>
          <Col>
            <Space wrap>
              {dataType === 'environmental' && (
                <Radio.Group
                  value={environmentalFilter}
                  onChange={(e) => setEnvironmentalFilter(e.target.value)}
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="all">{t('reports.chart.filter.all')}</Radio.Button>
                  {/* La palabra completa donde cabe. En el teléfono los tres botones con
                      «Temperatura» y «Humedad del aire» no entran en una línea, y ahí sí
                      compensa abreviar: es el único sitio donde el ancho manda. */}
                  <Radio.Button value="temperature">
                    {esMovil ? t('reports.table.tempShort') : t('reports.table.temperature')}
                  </Radio.Button>
                  <Radio.Button value="airHumidity">
                    {esMovil ? t('reports.table.airHumidityShort') : t('reports.table.airHumidity')}
                  </Radio.Button>
                </Radio.Group>
              )}

              {dataType === 'nutrients' && (
                <Radio.Group
                  value={nutrientFilter}
                  onChange={(e) => setNutrientFilter(e.target.value)}
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="all">{t('reports.chart.filter.all')}</Radio.Button>
                  <Radio.Button value="nitrogen">N</Radio.Button>
                  <Radio.Button value="phosphorus">P</Radio.Button>
                  <Radio.Button value="potassium">K</Radio.Button>
                </Radio.Group>
              )}

              <AntTooltip title={t('reports.chart.rain.hint')}>
                <Space size={6}>
                  <Switch size="small" checked={showRain} onChange={setShowRain} />
                  <span className="metric-row__last">{t('reports.chart.precipitation')}</span>
                </Space>
              </AntTooltip>
            </Space>
          </Col>
        </Row>
      }
      style={style}
    >
      <div ref={contenedor}>
        {series.map((item, index) => (
          <MetricRow
            key={item.refKey}
            item={item}
            metric={metrics?.[item.refKey]}
            points={seriesReducidas[item.dataKey]?.puntos ?? []}
            window={ventana}
            domainY={dominiosY[item.dataKey]}
            width={ancho}
            height={alto}
            last={index === series.length - 1}
            domainX={dominioX}
            ticksX={marcasX}
            formatTick={formatTick}
            rain={lluvia}
            rainMinWidth={anchoMinimoLluvia}
            dots={conPuntos}
            cursor={cursor}
            hovered={hoveredRow === item.refKey}
            onCursor={onCursor}
            onHover={onHover}
          />
        ))}

        {/* Cuántas lecturas se ven, cuántas hay y cuánto del periodo está sin medir. La
            reducción ocurría igual antes de todo esto —la hacía el navegador pisando píxeles—,
            sólo que en silencio. Decirlo es la diferencia entre resumir y disimular. */}
        <div className="metric-row__footer">
          <span>
            {reduciendo
              ? t('reports.chart.showingSome', {
                  drawn: String(dibujadas),
                  total: String(ventana.length),
                })
              : ventana.length === 1
              ? t('reports.chart.showingOne')
              : t('reports.chart.showingAll', { total: String(ventana.length) })}
          </span>
          {vacio >= 0.15 && (
            <span className="metric-row__hint">
              {t('reports.chart.emptyPeriod', { pct: String(Math.round(vacio * 100)) })}
            </span>
          )}
        </div>

        <PeriodNavigator data={data} window={zoom} onChange={setZoom} />
      </div>
    </Card>
  );
};
