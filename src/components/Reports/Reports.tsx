import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Card, Select, DatePicker, Button, Row, Col, Spin, message, Typography, Space } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useReports } from '../../hooks/useReports';
import { useI18n } from '../../contexts/I18nContext';
import { Farm, Section } from '../../hooks/useFarms';
import { ReportFilters, ReportData, ReportSummary } from '../../types/report.types';
import { ReportChart } from './ReportChart/ReportChart';
import { ReportSummaryComponent } from './ReportSummary/ReportSummary';
import { ReportTable } from './ReportTable/ReportTable';

import './Reports.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export const Reports: React.FC = () => {
  const { t } = useI18n();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | undefined>();
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [dataType, setDataType] = useState<'all' | 'environmental' | 'soil' | 'nutrients'>('all');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { 
    loading, 
    getFarms, 
    getSectionsByFarm, 
    generateReport, 
    getReportSummary,
    generateReportSummary,
    prepareChartData 
  } = useReports();

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadSections(selectedFarmId);
    } else {
      setSections([]);
      setSelectedSectionId(undefined);
    }
  }, [selectedFarmId]);

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Check initially
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadFarms = async () => {
    try {
      const farmsData = await getFarms();
      setFarms(farmsData);
    } catch (error) {
      message.error(t('reports.error.loadingFarms'));
    }
  };

  const loadSections = async (farmId: string) => {
    try {
      const sectionsData = await getSectionsByFarm(farmId);
      setSections(sectionsData);
      setSelectedSectionId(undefined); // Reset section selection
    } catch (error) {
      message.error(t('reports.error.loadingSections'));
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedFarmId) {
      message.warning(t('reports.warning.selectFarm'));
      return;
    }

    setIsGenerating(true);
    
    try {
      const filters: ReportFilters = {
        farmId: selectedFarmId,
        sectionId: selectedSectionId,
        startDate: dateRange[0],
        endDate: dateRange[1],
        dataType
      };

      const data = await generateReport(filters);
      const summary = await getReportSummary(filters);
      
      setReportData(data);
      setReportSummary(summary);
      setHasGenerated(true);
      
      message.success(t('reports.success.generated'));
    } catch (error: any) {
      console.error('Error generating report:', error);
      
      // Show specific error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data || 
                          error.message || 
                          t('reports.error.generating');
      
      message.error(`${t('reports.error.failed')}: ${errorMessage}`);
      
      // Reset states on error
      setReportData([]);
      setReportSummary(null);
      setHasGenerated(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'csv' && reportData.length > 0) {
      exportToCSV();
    } else {
      message.info(`${t('reports.export.comingSoon')} ${format.toUpperCase()}`);
    }
  };

  const exportToCSV = () => {
    const csvHeaders = [
      'Timestamp',
      'Farm Name',
      'Section Name',
      'Temperature (°C)',
      'Air Humidity (%)',
      'Soil Humidity (%)',
      'Precipitation',
      'Nitrogen (mg/L)',
      'Phosphorus (mg/L)',
      'Potassium (mg/L)'
    ];

    const csvRows = [
      csvHeaders.join(','),
      ...reportData.map(row => {
        // Support both spelling variants from backend
        const temperature = (row as any).celsiusGradeTemperature ?? row.celciusGradeTemperature;
        return [
          dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          `"${row.farmName}"`,
          `"${row.sectionName}"`,
          temperature?.toFixed(2) || '',
          row.airHumidityPercent?.toFixed(2) || '',
          row.soilHumidityPercent?.toFixed(2) || '',
          row.precipitationDetected ? 'Yes' : 'No',
          row.nitrogen?.toFixed(2) || '',
          row.phosphorus?.toFixed(2) || '',
          row.potassium?.toFixed(2) || ''
        ].join(',');
      })
    ];

    // Add BOM for better Excel compatibility with UTF-8
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `coffee_report_${dayjs().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success(t('reports.export.success'));
    }
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const selectedFarm = farms.find(f => f.id === selectedFarmId);
  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="header-title">
          <Title level={2} style={{ marginBottom: '8px', color: '#262626', fontSize: '24px' }}>
            {t('reports.title')}
          </Title>
          <Text type="secondary">
            {t('reports.description')}
          </Text>
        </div>
      </div>

      {/* Filters Card */}
      <Card 
        title={t('reports.dateRange')} 
        style={{ marginBottom: '24px' }}
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={handleGenerateReport}
            loading={isGenerating}
            disabled={!selectedFarmId}
            size="middle"
          >
            {t('reports.generate')}
          </Button>
        }
      >
        <Row gutter={[8, 8]}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>{t('reports.farmFilter')} *</Text>
              <Select
                style={{ width: '100%', marginTop: '4px' }}
                placeholder={t('reports.placeholders.selectFarm')}
                value={selectedFarmId}
                onChange={setSelectedFarmId}
                loading={loading}
                size="middle"
              >
                {farms.map(farm => (
                  <Option key={farm.id} value={farm.id}>
                    {farm.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>{t('reports.sectionFilter')}</Text>
              <Select
                style={{ width: '100%', marginTop: '4px' }}
                placeholder={t('reports.placeholders.allSections')}
                value={selectedSectionId}
                onChange={setSelectedSectionId}
                allowClear
                disabled={!selectedFarmId}
                size="middle"
              >
                {sections.map(section => (
                  <Option key={section.id} value={section.id}>
                    {section.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>{t('reports.dateRange')}</Text>
              <RangePicker
                style={{ width: '100%', marginTop: '4px' }}
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                allowClear={false}
                size="middle"
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>{t('reports.dataType')}</Text>
              <Select
                style={{ width: '100%', marginTop: '4px' }}
                value={dataType}
                onChange={setDataType}
                size="middle"
              >
                <Option value="all">{t('reports.dataTypes.all')}</Option>
                <Option value="environmental">{t('reports.dataTypes.environmental')}</Option>
                <Option value="soil">{t('reports.dataTypes.soil')}</Option>
                <Option value="nutrients">{t('reports.dataTypes.nutrients')}</Option>
              </Select>
            </div>
          </Col>
        </Row>

        {selectedFarm && (
          <div className="filter-highlight">
            <Text strong>{t('reports.selected')}: </Text>
            <Text>{selectedFarm.name}</Text>
            {selectedSection && (
              <>
                <Text> → </Text>
                <Text>{selectedSection.name}</Text>
              </>
            )}
            <Text> | </Text>
            <Text>{dateRange[0].format('MMM DD, YYYY')} - {dateRange[1].format('MMM DD, YYYY')}</Text>
          </div>
        )}
      </Card>

      {/* Loading State */}
      {isGenerating && (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>{t('reports.generating')}</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Report Results */}
      {hasGenerated && !isGenerating && (
        <>
          {/* Export Actions */}
          <Card style={{ marginBottom: '24px' }}>
            <Row justify="space-between" align="middle" gutter={[8, 8]}>
              <Col xs={24} sm={12}>
                <Title level={4} style={{ margin: 0 }}>
                  {t('reports.results')}
                </Title>
                <Text type="secondary">
                  {reportData.length} {t('reports.dataPointsFound')}
                </Text>
              </Col>
              <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={() => handleExportReport('csv')}
                    size="middle"
                    style={{ width: '100%' }}
                  >
                    {t('reports.export.csv')}
                  </Button>
                  {/* <Button 
                    icon={<DownloadOutlined />}
                    onClick={() => handleExportReport('excel')}
                    size="middle"
                    style={{ width: '100%' }}
                  >
                    Export Excel
                  </Button>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={() => handleExportReport('pdf')}
                    size="middle"
                    style={{ width: '100%' }}
                  >
                    Export PDF
                  </Button> */}
                </Space>
              </Col>
            </Row>
          </Card>

          {reportData.length > 0 ? (
            <>
              {/* Summary */}
              {/* {reportSummary && (
                <ReportSummaryComponent summary={reportSummary} style={{ marginBottom: '24px' }} />
              )} */}

              {/* Charts - Hidden on mobile */}
              {!isMobile && (
                <ReportChart 
                  data={prepareChartData(reportData)} 
                  dataType={dataType}
                  style={{ marginBottom: '24px' }}
                />
              )}

              {/* Data Table */}
              <ReportTable data={reportData} />
            </>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  {t('reports.noDataFound')}
                </Text>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Initial State */}
      {!hasGenerated && !isGenerating && (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {t('reports.initialState')}
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};