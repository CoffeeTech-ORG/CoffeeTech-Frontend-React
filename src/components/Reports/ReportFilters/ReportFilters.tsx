import React from 'react';
import { Select, DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { Farm, Section } from '../../../hooks/useFarms';
import { useI18n } from '../../../contexts/I18nContext';
import './ReportFilters.scss';

const { RangePicker } = DatePicker;

/** Prototype shortcuts. `custom` opens the calendar. */
export type RangePreset = '7d' | '30d' | '90d' | 'custom';
export type DataType = 'all' | 'environmental' | 'soil' | 'nutrients';

interface ReportFiltersProps {
  farms: Farm[];
  sections: Section[];
  farmId?: string;
  sectionId?: string;
  preset: RangePreset;
  dateRange: [Dayjs, Dayjs];
  dataType: DataType;
  loadingFarms?: boolean;
  onFarm: (id: string) => void;
  onSection: (id?: string) => void;
  onPreset: (preset: RangePreset) => void;
  onDateRange: (range: [Dayjs, Dayjs]) => void;
  onDataType: (type: DataType) => void;
}

/** Days for each shortcut; `custom` has none, the user picks it. */
export const PRESET_DAYS: Record<Exclude<RangePreset, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const rangeForPreset = (preset: Exclude<RangePreset, 'custom'>): [Dayjs, Dayjs] => [
  dayjs().subtract(PRESET_DAYS[preset], 'day'),
  dayjs(),
];

/**
 * The report filters.
 *
 * They apply ON CHANGE: a "Generate Report" button forced an extra step no other screen in the app
 * asks for, and left doubt about whether what is shown matches the filters set. The range shortcuts
 * are segmented because they are four fixed options; the calendar only appears when "custom" is
 * chosen.
 *
 * The farm stays a `Select`: the list grows with the account and a segmented control of nine farms
 * does not fit. The sections too, for the same reason.
 */
export const ReportFilters: React.FC<ReportFiltersProps> = ({
  farms,
  sections,
  farmId,
  sectionId,
  preset,
  dateRange,
  dataType,
  loadingFarms,
  onFarm,
  onSection,
  onPreset,
  onDateRange,
  onDataType,
}) => {
  const { t } = useI18n();

  const presets: RangePreset[] = ['7d', '30d', '90d', 'custom'];
  const tipos: DataType[] = ['all', 'environmental', 'soil', 'nutrients'];

  return (
    <div className="report-filters">
      <div className="report-filters__row">
        <label className="report-filters__field report-filters__field--select">
          <span className="report-filters__label">{t('reports.farmFilter')} *</span>
          <Select
            className="report-filters__select"
            placeholder={t('reports.placeholders.selectFarm')}
            value={farmId}
            onChange={onFarm}
            loading={loadingFarms}
            options={farms.map((f) => ({ value: f.id, label: f.name }))}
          />
        </label>

        <label className="report-filters__field report-filters__field--select">
          <span className="report-filters__label">{t('reports.sectionFilter')}</span>
          <Select
            className="report-filters__select"
            placeholder={t('reports.placeholders.allSections')}
            value={sectionId}
            onChange={onSection}
            allowClear
            disabled={!farmId}
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
          />
        </label>

        <div className="report-filters__field report-filters__field--seg">
          <span className="report-filters__label">{t('reports.dateRange')}</span>
          <div className="report-filters__seg" role="group" aria-label={t('reports.dateRange')}>
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                className={p === preset ? 'is-on' : ''}
                aria-pressed={p === preset}
                onClick={() => onPreset(p)}
              >
                {t(`reports.range.${p}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="report-filters__field report-filters__field--seg">
          <span className="report-filters__label">{t('reports.dataType')}</span>
          <div className="report-filters__seg" role="group" aria-label={t('reports.dataType')}>
            {tipos.map((tipo) => (
              <button
                key={tipo}
                type="button"
                className={tipo === dataType ? 'is-on' : ''}
                aria-pressed={tipo === dataType}
                onClick={() => onDataType(tipo)}
              >
                {t(`reports.dataTypes.${tipo}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* El calendario sólo cuando hace falta: ocupaba una columna fija para algo que se usa
          en una de cada cuatro consultas. */}
      {preset === 'custom' && (
        <div className="report-filters__custom">
          <span className="report-filters__label">{t('reports.range.custom')}</span>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) onDateRange([dates[0], dates[1]]);
            }}
            format="DD MMM YYYY"
            allowClear={false}
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
          />
        </div>
      )}
    </div>
  );
};
