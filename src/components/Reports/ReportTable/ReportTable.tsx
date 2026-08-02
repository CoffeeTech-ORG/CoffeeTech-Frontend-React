import React, { useState } from 'react';
import { Card, Table, Typography, Input } from 'antd';
// lucide, like the rest of the app. antd's `Search` is the search input, so the icon is imported
// under an alias so two things with the same name do not collide.
import { Search as SearchIcon, ChevronDown, ChevronUp } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useI18n } from '../../../contexts/I18nContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { ReportData } from '../../../types/report.types';
import { ReferenceRanges } from '../../../services/reference.service';
import { judgeValue, verdictTokens, chipLabel } from '../ReportChart/referenceHelpers';
import './ReportTable.scss';

const { Title } = Typography;
const { Search } = Input;

interface ReportTableProps {
  data: ReportData[];
  /** The engine's bands. Without them the table shows the numbers without judging them. */
  reference?: ReferenceRanges | null;
  style?: React.CSSProperties;
}

export const ReportTable: React.FC<ReportTableProps> = ({ data, reference, style }) => {
  const { t } = useI18n();
  const [filteredData, setFilteredData] = useState<ReportData[]>(data);
  const [, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [, setSearchClicked] = useState(false);
  const isMobile = useIsMobile();

  /**
   * On the phone the table starts collapsed.
   *
   * Whoever looks at the history from mobile comes to see the trend, and 711 rows of nine columns
   * ahead of the chart are a wall. It is not hidden -- the raw data backs everything else -- but it is
   * asked for.
   */
  const [abierta, setAbierta] = useState(!isMobile);
  React.useEffect(() => setAbierta(!isMobile), [isMobile]);

  const pageSizes = [10, 25, 50, 100];
  const total = filteredData.length;

  React.useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleSearch = (value: string) => {
    if (!value) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item =>
        item.farmName.toLowerCase().includes(value.toLowerCase()) ||
        item.sectionName.toLowerCase().includes(value.toLowerCase()) ||
        dayjs(item.timestamp).format('YYYY-MM-DD HH:mm').includes(value)
      );
      setFilteredData(filtered);
    }
  };

  /**
   * A measured cell, judged against the SAME band the engine applies.
   *
   * This table had its own ranges table: optimal temperature 18-25 °C and humidities 70-80 / 50-70.
   * The engine, for this stage, gives 15-23 °C. So a 24 °C came out GREEN in the table and OUT OF BAND
   * in the chart above, on the same screen.
   *
   * With no model reference it is not coloured: a number without judgement is honest; one with the
   * wrong judgement is not.
   */
  const celda = (
    value: number | null | undefined,
    metricKey: keyof NonNullable<typeof reference>['metrics'],
    digits = 1,
    suffix = ''
  ) => {
    if (value === null || value === undefined) {
      return <span className="report-table__empty">--</span>;
    }

    const texto = `${value.toFixed(digits)}${suffix}`;
    const verdict = reference ? judgeValue(reference.metrics[metricKey], value) : null;
    if (!verdict) return <span className="report-table__plain">{texto}</span>;

    const tone = verdictTokens(verdict);
    return (
      <span
        className="report-table__cell"
        style={{ color: tone.fg, background: tone.bg, borderColor: tone.border }}
        // With the engine's explanation when there is one: "Wet leaf" alone does not say what is
        // wrong with 92 %.
        title={chipLabel(verdict.explanation ?? verdict.label)}
      >
        {texto}
      </span>
    );
  };

  const columns: ColumnsType<ReportData> = [
    {
      title: t('reports.table.timestamp'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: isMobile ? 100 : 150,
      render: (timestamp) => dayjs(timestamp).format(isMobile ? 'DD/MM HH:mm' : 'DD/MM/YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: t('reports.table.farm'),
      dataIndex: 'farmName',
      key: 'farmName',
      width: isMobile ? 80 : 120,
      ellipsis: true,
    },
    {
      title: t('reports.table.section'),
      dataIndex: 'sectionName',
      key: 'sectionName',
      width: isMobile ? 80 : 120,
      ellipsis: true,
    },
    {
      title: isMobile ? t('reports.table.tempShort') : t('reports.table.temperature'),
      dataIndex: 'celsiusGradeTemperature',
      key: 'temperature',
      width: isMobile ? 70 : 100,
      align: 'center',
      render: (temp) => celda(temp, 'temperature', 1, isMobile ? '°' : ' °C'),
      sorter: (a, b) => {
        const tempA = (a as any).celsiusGradeTemperature ?? a.celciusGradeTemperature ?? 0;
        const tempB = (b as any).celsiusGradeTemperature ?? b.celciusGradeTemperature ?? 0;
        return tempA - tempB;
      },
    },
    {
      title: isMobile ? t('reports.table.airHumidityShort') : t('reports.table.airHumidity'),
      dataIndex: 'airHumidityPercent',
      key: 'airHumidity',
      width: isMobile ? 70 : 110,
      align: 'center',
      render: (humidity) => celda(humidity, 'air_humidity', 1, ' %'),
      sorter: (a, b) => (a.airHumidityPercent || 0) - (b.airHumidityPercent || 0),
    },
    {
      title: isMobile ? t('reports.table.soilHumidityShort') : t('reports.table.soilHumidity'),
      dataIndex: 'soilHumidityPercent',
      key: 'soilHumidity',
      width: isMobile ? 70 : 110,
      align: 'center',
      // Soil moisture is shown WITHOUT judgement on purpose: the engine gives it no absolute band,
      // it derives its threshold from each plot's wet-dry envelope.
      render: (humidity) => celda(humidity, 'soil_humidity', 1, ' %'),
      sorter: (a, b) => (a.soilHumidityPercent || 0) - (b.soilHumidityPercent || 0),
    },
    {
      title: isMobile ? t('reports.table.precipitationShort') : t('reports.table.precipitation'),
      dataIndex: 'precipitationDetected',
      key: 'precipitation',
      width: isMobile ? 60 : 100,
      align: 'center',
      render: (precipitation) => {
        // precipitationDetected: 1 = rained, 0 = did not rain
        const hasRained = precipitation === 1 || precipitation === true || precipitation === '1';
        return (
          // Yes/no, no severity: rain is neither good nor bad, it is a fact of the weather.
          <span className={`report-table__rain${hasRained ? ' is-rain' : ''}`}>
            {hasRained ? t('common.yes') : t('common.no')}
          </span>
        );
      },
      filters: [
        { text: t('common.yes'), value: 1 }, // 1 = rained
        { text: t('common.no'), value: 0 },  // 0 = did not rain
      ],
      onFilter: (value, record) => {
        const precipValue = record.precipitationDetected;
        if (value === 1) {
          // Filter by "rained" (1, true, '1')
          return precipValue === 1 || precipValue === true || precipValue === '1';
        } else {
          // Filter by "did not rain" (0, false, '0')
          return precipValue === 0 || precipValue === false || precipValue === '0';
        }
      },
    },
    {
      title: 'N',
      dataIndex: 'nitrogen',
      key: 'nitrogen',
      width: isMobile ? 50 : 80,
      align: 'center',
      // Nutrients are judged like everything else, not coloured by identity: in a table, green and
      // amber read as severity, not as "this column is N/P/K". Different axes (see `statusTokens`).
      render: (value) => celda(value, 'N', 0),
      sorter: (a, b) => (a.nitrogen || 0) - (b.nitrogen || 0),
    },
    {
      title: 'P',
      dataIndex: 'phosphorus',
      key: 'phosphorus',
      width: isMobile ? 50 : 80,
      align: 'center',
      render: (value) => celda(value, 'P', 0),
      sorter: (a, b) => (a.phosphorus || 0) - (b.phosphorus || 0),
    },
    {
      title: 'K',
      dataIndex: 'potassium',
      key: 'potassium',
      width: isMobile ? 50 : 80,
      align: 'center',
      render: (value) => celda(value, 'K', 0),
      sorter: (a, b) => (a.potassium || 0) - (b.potassium || 0),
    },
  ];

  return (
    <Card
      className="report-table-container"
      title={
        <div className="report-table__head">
          <Title level={4} style={{ margin: 0 }}>
            {t('reports.table.title')}
          </Title>
          {/* La búsqueda sólo cuando hay tabla que buscar. */}
          {abierta && (
            <Search
              className="report-table__search"
              placeholder={isMobile ? t('reports.table.searchShort') : t('reports.table.searchPlaceholder')}
              allowClear
              enterButton={<SearchIcon size={15} />}
              size={isMobile ? 'small' : 'middle'}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
            />
          )}
        </div>
      }
      // No `margin: 0 auto`: inside a column flex container that CANCELS the stretch, so the card
      // shrank to its content (~880 px) and sat centred with a gap on each side. The spacing above and
      // below comes from `.reports`' `gap`.
      style={style}
    >
      {isMobile && (
        <button
          type="button"
          className="report-table__disclose"
          aria-expanded={abierta}
          onClick={() => setAbierta((v) => !v)}
        >
          {abierta ? t('reports.table.hide') : t('reports.table.reveal', { n: String(total) })}
          {abierta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}

      {abierta && (
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => `${record.id}_${record.timestamp}`}
          pagination={{
            className: 'custom-pagination',
            pageSizeOptions: isMobile ? [5, 10, 25] : pageSizes,
            showSizeChanger: !isMobile,
            size: isMobile ? 'small' : 'default',
            defaultPageSize: isMobile ? 5 : pageSizes[0],
            locale: { items_per_page: t('reports.table.perPage') },
            defaultCurrent: page,
            showTotal: (total) => `${t('reports.table.total')}: ${total}`,
            onShowSizeChange: (_current, size) => {
              setSearchClicked(true);
              setPageSize(size);
            },
            current: page,
            onChange: (page, _pageSize) => {
              setSearchClicked(true);
              setPage(page);
            },
            total: total,
            simple: isMobile,
          }}
          scroll={{ x: 'max-content' }}
          size={isMobile ? 'small' : 'middle'}
          bordered={!isMobile}
        />
      )}
    </Card>
  );
};