import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { App as AntdApp } from 'antd';
import { Download, Info } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { useI18n } from '../../contexts/I18nContext';
import { Farm, Section } from '../../hooks/useFarms';
import { ReportFilters as ReportFiltersType, ReportData } from '../../types/report.types';
import { ReportChart } from './ReportChart/ReportChart';
import { ReportTable } from './ReportTable/ReportTable';
import {
  ReportFilters,
  RangePreset,
  DataType,
  PRESET_DAYS,
  rangeForPreset,
} from './ReportFilters/ReportFilters';
import { ReportStats } from './ReportStats/ReportStats';
import { RainStrip } from './RainStrip/RainStrip';
import { RegionalRainBand } from './RegionalRainBand/RegionalRainBand';
import { Skeleton } from '../ui/Skeleton';
import { normalizeGrowthStage, referenceService, ReferenceRanges } from '../../services/reference.service';
import { sensorService } from '../../services/sensor.service';
import { countAlertsInRange } from '../../services/diagnosis.service';
import './Reports.scss';

/** Wait before querying after a filter change. */
const DEBOUNCE_MS = 350;

export const Reports: React.FC = () => {
  const { t } = useI18n();
  const { message } = AntdApp.useApp();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | undefined>();
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(rangeForPreset('30d'));
  const [dataType, setDataType] = useState<DataType>('all');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [consultando, setConsultando] = useState(false);
  const [reference, setReference] = useState<ReferenceRanges | null>(null);
  const [alertas, setAlertas] = useState<number | null>(null);

  const { loading, getFarms, getSectionsByFarm, generateReport, prepareChartData } = useReports();

  // The chosen farm carries coordinates and altitude, which the regional rain band needs to request
  // the right cell and apply the downscaling.
  const fincaElegida = farms.find((f) => f.id === selectedFarmId);

  useEffect(() => {
    getFarms()
      .then(setFarms)
      .catch(() => message.error(t('reports.error.loadingFarms')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedFarmId) {
      setSections([]);
      setSelectedSectionId(undefined);
      return;
    }
    getSectionsByFarm(selectedFarmId)
      .then((data) => {
        setSections(data);
        setSelectedSectionId(undefined);
      })
      .catch(() => message.error(t('reports.error.loadingSections')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFarmId]);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  // The engine tightens some bands by stage (K in filling/ripening), so the reference is requested
  // for the chosen section's stage. With "all sections" the stage is ambiguous: it is left unset and
  // the engine returns its base reading.
  const stage = selectedSection
    ? selectedSection.growthStage ?? normalizeGrowthStage(selectedSection.type)
    : undefined;

  useEffect(() => {
    let cancelado = false;
    referenceService.getReferenceRanges(stage).then((r) => {
      if (!cancelado) setReference(r);
    });
    return () => {
      cancelado = true;
    };
  }, [stage]);

  /**
   * Queries the report with the current filters.
   *
   * It fires on any of them changing, so there is no "Generate Report" step -- one no other screen
   * asks for, that left doubt about whether the screen matched the filters set.
   *
   * `dataType` does NOT belong here. Each sensor reading carries the six metrics in the same row, so
   * asking for "environmental" saves no rows: it only empties columns. With the data type among the
   * dependencies, switching tab re-requested exactly the same thing from the backend and the skeleton
   * flashed back for a few milliseconds. The data type decides WHICH series are drawn, and that is
   * resolved on the client from what is already in memory.
   */
  const consultar = useCallback(async () => {
    if (!selectedFarmId) {
      setReportData([]);
      setAlertas(null);
      return;
    }

    setConsultando(true);
    try {
      const filters: ReportFiltersType = {
        farmId: selectedFarmId,
        sectionId: selectedSectionId,
        startDate: dateRange[0],
        endDate: dateRange[1],
        dataType: 'all',
      };
      const data = await generateReport(filters);
      setReportData(data);

      // Period alerts: the farm's hubs (or the chosen section's) are needed to filter the engine's
      // history. Kept apart because its failure must not take down the report.
      try {
        const hubs = await sensorService.getAllSensors();
        const idsSeccion = selectedSectionId
          ? [Number(selectedSectionId)]
          : sections.map((s) => Number(s.id));
        const míos = hubs
          .filter((h) => h.sectionId != null && idsSeccion.includes(h.sectionId))
          .map((h) => h.deviceHubId);
        setAlertas(
          await countAlertsInRange(míos, dateRange[0].toDate(), dateRange[1].endOf('day').toDate())
        );
      } catch {
        setAlertas(null);
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      message.error(
        `${t('reports.error.failed')}: ${
          error?.response?.data?.message ?? error?.message ?? t('reports.error.generating')
        }`
      );
      setReportData([]);
      setAlertas(null);
    } finally {
      setConsultando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFarmId, selectedSectionId, dateRange, sections]);

  // One filter change = one query, not one per calendar keystroke.
  const timer = useRef<number>();
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(consultar, DEBOUNCE_MS);
    return () => window.clearTimeout(timer.current);
  }, [consultar]);

  const chartData = useMemo(() => prepareChartData(reportData), [reportData, prepareChartData]);

  /** The range the readings actually cover, which can be much shorter than the requested one. */
  const rangoReal = useMemo(() => {
    const stamps = reportData
      .map((row) => dayjs(row.timestamp))
      .filter((d) => d.isValid())
      .sort((a, b) => a.valueOf() - b.valueOf());
    if (stamps.length === 0) return null;
    return { desde: stamps[0], hasta: stamps[stamps.length - 1] };
  }, [reportData]);

  const fmtDia = (d: Dayjs) => d.format('DD MMM YYYY');

  // The notice only appears when period is really missing: if the data covers what was asked, saying
  // so would be noise. A day of margin on each side avoids warning over the sampling's natural gap.
  const faltaPeriodo =
    rangoReal !== null &&
    (rangoReal.desde.diff(dateRange[0], 'day') > 1 || dateRange[1].diff(rangoReal.hasta, 'day') > 1);

  const diasPedidos =
    preset === 'custom' ? Math.max(1, dateRange[1].diff(dateRange[0], 'day') + 1) : PRESET_DAYS[preset];

  const exportarCSV = () => {
    if (reportData.length === 0) return;
    const headers = [
      'Timestamp',
      'Farm Name',
      'Section Name',
      'Temperature (°C)',
      'Air Humidity (%)',
      'Soil Humidity (%)',
      'Precipitation',
      // mg/kg, not mg/L: the sensor measures over soil, like the engine's bands.
      'Nitrogen (mg/kg)',
      'Phosphorus (mg/kg)',
      'Potassium (mg/kg)',
    ];

    const filas = [
      headers.join(','),
      ...reportData.map((row) => {
        const temperature = (row as any).celsiusGradeTemperature ?? row.celciusGradeTemperature;
        const llovio =
          row.precipitationDetected === 1 ||
          row.precipitationDetected === true ||
          row.precipitationDetected === '1';
        return [
          dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          `"${row.farmName}"`,
          `"${row.sectionName}"`,
          temperature?.toFixed(2) || '',
          row.airHumidityPercent?.toFixed(2) || '',
          row.soilHumidityPercent?.toFixed(2) || '',
          llovio ? 'Yes' : 'No',
          row.nitrogen?.toFixed(2) || '',
          row.phosphorus?.toFixed(2) || '',
          row.potassium?.toFixed(2) || '',
        ].join(',');
      }),
    ];

    // BOM so Excel recognises the UTF-8.
    const blob = new Blob(['﻿' + filas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `coffeetech_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success(t('reports.export.success'));
  };

  const hayDatos = reportData.length > 0;
  const diasConLluvia = reportData.some(
    (r) =>
      r.precipitationDetected === 1 ||
      r.precipitationDetected === true ||
      r.precipitationDetected === '1'
  );

  return (
    <div className="reports">
      <header className="reports__intro">
        <p className="reports__eyebrow">{t('reports.eyebrow')}</p>
        <h1 className="reports__title">{t('reports.title')}</h1>
      </header>

      <ReportFilters
        farms={farms}
        sections={sections}
        farmId={selectedFarmId}
        sectionId={selectedSectionId}
        preset={preset}
        dateRange={dateRange}
        dataType={dataType}
        loadingFarms={loading}
        onFarm={setSelectedFarmId}
        onSection={setSelectedSectionId}
        onPreset={(p) => {
          setPreset(p);
          if (p !== 'custom') setDateRange(rangeForPreset(p));
        }}
        onDateRange={setDateRange}
        onDataType={setDataType}
      />

      {!selectedFarmId ? (
        <p className="reports__empty">{t('reports.pickFarm')}</p>
      ) : consultando ? (
        <div className="reports__loading">
          <Skeleton variant="block" height={96} />
          <Skeleton variant="block" height={320} />
        </div>
      ) : !hayDatos ? (
        <p className="reports__empty">{t('reports.noData')}</p>
      ) : (
        <>
          {/* El filtro puede pedir un mes y los datos cubrir dos días: anunciar el rango pedido
              hacía creer que se estaba viendo el periodo completo. */}
          {faltaPeriodo && rangoReal && (
            <p className="reports__range-notice">
              <Info size={16} aria-hidden="true" />
              <span>
                {t('reports.rangeNotice', {
                  requested: `${fmtDia(dateRange[0])} → ${fmtDia(dateRange[1])}`,
                  actual: `${fmtDia(rangoReal.desde)} → ${fmtDia(rangoReal.hasta)}`,
                })}
              </span>
            </p>
          )}

          <ReportStats
            data={reportData}
            chartData={chartData}
            reference={reference}
            daysRequested={diasPedidos}
            alerts={alertas}
          />

          <div className="reports__legend">
            <span className="reports__legend-item">
              <i className="reports__swatch reports__swatch--line" aria-hidden="true" />
              {t('reports.legend.measured')}
            </span>
            <span className="reports__legend-item">
              <i className="reports__swatch reports__swatch--band" aria-hidden="true" />
              {t('reports.legend.band')}
            </span>
            {/* La cuarta que faltaba. Humedad del aire dibuja dos líneas punteadas —el motor la
                publica con umbrales de riesgo y sin banda— y hasta ahora nada las presentaba. */}
            <span className="reports__legend-item">
              <i className="reports__swatch reports__swatch--threshold" aria-hidden="true" />
              {t('reports.legend.threshold')}
            </span>
            <span className="reports__legend-item">
              <i className="reports__swatch reports__swatch--rain" aria-hidden="true" />
              {t('reports.legend.rain')}
            </span>
            <span className="reports__legend-hint">{t('reports.legend.hint')}</span>
          </div>

          <div className="reports__panels">
            <ReportChart data={chartData} dataType={dataType} growthStage={stage} />
            <RainStrip data={reportData} />
            {/* Los milimetros van DEBAJO y aparte: el sensor no los mide —su lluvia es un
                binario— asi que salen del reanalisis regional, que es otra fuente y otra
                escala. Juntarlos con la tira medida los haria pasar por medicion de la
                parcela. Deliberadamente NO entran en `ReportStats` ni en la exportacion. */}
            <RegionalRainBand
              latitude={fincaElegida?.latitude ?? null}
              longitude={fincaElegida?.longitude ?? null}
              altitude={fincaElegida?.altitude ?? null}
              range={dateRange}
            />
          </div>

          {/* Sólo cuando hubo lluvia en el periodo: sin ella, la nota explica un fenómeno que
              no está en pantalla. */}
          {diasConLluvia && (
            <aside className="reports__note">
              <span className="reports__note-tag">{t('reports.note.tag')}</span>
              <div>
                <p className="reports__note-title">{t('reports.note.title')}</p>
                <p className="reports__note-body">{t('reports.note.body')}</p>
              </div>
            </aside>
          )}

          <ReportTable data={reportData} reference={reference} />

          <section className="reports__export">
            <div>
              <p className="reports__export-title">{t('reports.export.title')}</p>
              <p className="reports__export-meta">
                {t('reports.stats.readings')}: {reportData.length}
                {rangoReal && ` · ${fmtDia(rangoReal.desde)} → ${fmtDia(rangoReal.hasta)}`}
              </p>
            </div>
            <div className="reports__export-actions">
              <button type="button" className="reports__export-csv" onClick={exportarCSV}>
                <Download size={16} aria-hidden="true" />
                CSV
              </button>
              {/* PDF y Excel se enseñan deshabilitados y no ocultos: en el backend son *stubs*
                  que devuelven CSV y texto plano, así que ofrecerlos sería prometer un archivo
                  que no existe; esconderlos, en cambio, borraría el plan. */}
              {['PDF', 'Excel'].map((f) => (
                <span key={f} className="reports__export-soon">
                  <Download size={16} aria-hidden="true" />
                  {f}
                  <em>{t('reports.export.soon')}</em>
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
