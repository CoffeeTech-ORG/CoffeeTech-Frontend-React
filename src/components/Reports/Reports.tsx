import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Card, Select, DatePicker, Button, Row, Col, Spin, message, Typography, Space } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useReports } from '../../hooks/useReports';
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

  const { 
    loading, 
    getFarms, 
    getSectionsByFarm, 
    generateReport, 
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

  const loadFarms = async () => {
    try {
      const farmsData = await getFarms();
      setFarms(farmsData);
    } catch (error) {
      message.error('Error loading farms');
    }
  };

  const loadSections = async (farmId: string) => {
    try {
      const sectionsData = await getSectionsByFarm(farmId);
      setSections(sectionsData);
      setSelectedSectionId(undefined); // Reset section selection
    } catch (error) {
      message.error('Error loading sections');
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedFarmId) {
      message.warning('Please select a farm to generate the report');
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
      const summary = generateReportSummary(data);
      
      setReportData(data);
      setReportSummary(summary);
      setHasGenerated(true);
      
      message.success('Report generated successfully');
    } catch (error) {
      message.error('Error generating report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'csv' && reportData.length > 0) {
      exportToCSV();
    } else {
      message.info(`Export to ${format.toUpperCase()} will be implemented soon`);
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
      ...reportData.map(row => [
        dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss'),
        `"${row.farmName}"`,
        `"${row.sectionName}"`,
        row.celsiusGradeTemperature?.toFixed(2) || '',
        row.airHumidityPercent?.toFixed(2) || '',
        row.soilHumidityPercent?.toFixed(2) || '',
        row.precipitationDetected ? 'Yes' : 'No',
        row.nitrogen?.toFixed(2) || '',
        row.phosphorus?.toFixed(2) || '',
        row.potassium?.toFixed(2) || ''
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
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
      message.success('Report exported to CSV successfully');
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
    <div className="reports-container" style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px', color: '#1a1a1a' }}>
          Reports Dashboard
        </Title>
        <Text type="secondary">
          Generate comprehensive reports for your farms and sections
        </Text>
      </div>

      {/* Filters Card */}
      <Card 
        title="Report Filters" 
        style={{ marginBottom: '24px' }}
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={handleGenerateReport}
              loading={isGenerating}
              disabled={!selectedFarmId}
            >
              Generate Report
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>Farm *</Text>
              <Select
                style={{ width: '100%', marginTop: '4px' }}
                placeholder="Select a farm"
                value={selectedFarmId}
                onChange={setSelectedFarmId}
                loading={loading}
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
              <Text strong>Section</Text>
              <Select
                style={{ width: '100%', marginTop: '4px' }}
                placeholder="All sections"
                value={selectedSectionId}
                onChange={setSelectedSectionId}
                allowClear
                disabled={!selectedFarmId}
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
              <Text strong>Date Range</Text>
              <RangePicker
                style={{ width: '100%', marginTop: '4px' }}
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                allowClear={false}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <Text strong>Data Type</Text>
              <Select
                style={{ width: '100%', marginTop: '4px' }}
                value={dataType}
                onChange={setDataType}
              >
                <Option value="all">All Data</Option>
                <Option value="environmental">Environmental</Option>
                <Option value="soil">Soil Data</Option>
                <Option value="nutrients">Nutrients</Option>
              </Select>
            </div>
          </Col>
        </Row>

        {selectedFarm && (
          <div className="filter-highlight">
            <Text strong>Selected: </Text>
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
              <Text>Generating report...</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Report Results */}
      {hasGenerated && !isGenerating && (
        <>
          {/* Export Actions */}
          <Card style={{ marginBottom: '24px' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4} style={{ margin: 0 }}>
                  Report Results
                </Title>
                <Text type="secondary">
                  {reportData.length} data points found
                </Text>
              </Col>
              <Col>
                <Space>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={() => handleExportReport('csv')}
                  >
                    Export CSV
                  </Button>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={() => handleExportReport('excel')}
                  >
                    Export Excel
                  </Button>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={() => handleExportReport('pdf')}
                  >
                    Export PDF
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {reportData.length > 0 ? (
            <>
              {/* Summary */}
              {reportSummary && (
                <ReportSummaryComponent summary={reportSummary} style={{ marginBottom: '24px' }} />
              )}

              {/* Charts */}
              <ReportChart 
                data={prepareChartData(reportData)} 
                dataType={dataType}
                style={{ marginBottom: '24px' }}
              />

              {/* Data Table */}
              <ReportTable data={reportData} />
            </>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  No data found for the selected criteria
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
              Select your filters and click "Generate Report" to view data
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};