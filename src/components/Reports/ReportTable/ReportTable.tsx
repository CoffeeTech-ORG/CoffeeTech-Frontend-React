import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Input } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ReportData } from '../../../types/report.types';

const { Title } = Typography;
const { Search } = Input;

interface ReportTableProps {
  data: ReportData[];
  style?: React.CSSProperties;
}

export const ReportTable: React.FC<ReportTableProps> = ({ data, style }) => {
  const [filteredData, setFilteredData] = useState<ReportData[]>(data);
  const [pageSize, setPageSize] = useState(10);

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

  const getTemperatureColor = (temp: number | null | undefined): string => {
    if (temp === null || temp === undefined) return '';
    if (temp < 15) return '#1890ff'; // Blue for cold
    if (temp > 30) return '#ff4d4f'; // Red for hot
    if (temp >= 18 && temp <= 25) return '#52c41a'; // Green for optimal
    return '#faad14'; // Orange for suboptimal
  };

  const getHumidityColor = (humidity: number | null | undefined, isAir: boolean = true): string => {
    if (humidity === null || humidity === undefined) return '';
    const optimalRange = isAir ? [70, 80] : [50, 70];
    if (humidity >= optimalRange[0] && humidity <= optimalRange[1]) return '#52c41a';
    if (humidity >= optimalRange[0] - 10 && humidity <= optimalRange[1] + 10) return '#faad14';
    return '#ff4d4f';
  };

  const columns: ColumnsType<ReportData> = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (timestamp) => dayjs(timestamp).format('MM/DD/YY HH:mm'),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Farm',
      dataIndex: 'farmName',
      key: 'farmName',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Section',
      dataIndex: 'sectionName',
      key: 'sectionName',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Temperature',
      dataIndex: 'celsiusGradeTemperature',
      key: 'temperature',
      width: 100,
      align: 'center',
      render: (temp) => temp !== null && temp !== undefined ? (
        <Tag color={getTemperatureColor(temp)}>
          {temp.toFixed(1)}°C
        </Tag>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.celsiusGradeTemperature || 0) - (b.celsiusGradeTemperature || 0),
    },
    {
      title: 'Air Humidity',
      dataIndex: 'airHumidityPercent',
      key: 'airHumidity',
      width: 110,
      align: 'center',
      render: (humidity) => humidity !== null && humidity !== undefined ? (
        <Tag color={getHumidityColor(humidity, true)}>
          {humidity.toFixed(1)}%
        </Tag>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.airHumidityPercent || 0) - (b.airHumidityPercent || 0),
    },
    {
      title: 'Soil Humidity',
      dataIndex: 'soilHumidityPercent',
      key: 'soilHumidity',
      width: 110,
      align: 'center',
      render: (humidity) => humidity !== null && humidity !== undefined ? (
        <Tag color={getHumidityColor(humidity, false)}>
          {humidity.toFixed(1)}%
        </Tag>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.soilHumidityPercent || 0) - (b.soilHumidityPercent || 0),
    },
    {
      title: 'Precipitation',
      dataIndex: 'precipitationDetected',
      key: 'precipitation',
      width: 100,
      align: 'center',
      render: (precipitation) => (
        <Tag color={precipitation ? '#1890ff' : '#f5f5f5'} style={{ color: precipitation ? '#fff' : '#999' }}>
          {precipitation ? 'Yes' : 'No'}
        </Tag>
      ),
      filters: [
        { text: 'Yes', value: true },
        { text: 'No', value: false },
      ],
      onFilter: (value, record) => record.precipitationDetected === value,
    },
    {
      title: 'N',
      dataIndex: 'nitrogen',
      key: 'nitrogen',
      width: 80,
      align: 'center',
      render: (value) => value !== null && value !== undefined ? (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          {value.toFixed(1)}
        </span>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.nitrogen || 0) - (b.nitrogen || 0),
    },
    {
      title: 'P',
      dataIndex: 'phosphorus',
      key: 'phosphorus',
      width: 80,
      align: 'center',
      render: (value) => value !== null && value !== undefined ? (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {value.toFixed(1)}
        </span>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.phosphorus || 0) - (b.phosphorus || 0),
    },
    {
      title: 'K',
      dataIndex: 'potassium',
      key: 'potassium',
      width: 80,
      align: 'center',
      render: (value) => value !== null && value !== undefined ? (
        <span style={{ color: '#faad14', fontWeight: 'bold' }}>
          {value.toFixed(1)}
        </span>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.potassium || 0) - (b.potassium || 0),
    },
  ];

  return (
    <Card
      className="report-table-container"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            Raw Data Table
          </Title>
          <Space>
            <Search
              placeholder="Search farms, sections, or dates"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
              style={{ width: 250 }}
            />
            <Button icon={<FilterOutlined />} size="middle">
              Filters
            </Button>
          </Space>
        </div>
      }
      style={style}
    >
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey={(record) => `${record.id}_${record.timestamp}`}
        pagination={{
          total: filteredData.length,
          pageSize: pageSize,
          showSizeChanger: true,
          showQuickJumper: false,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} records`,
          pageSizeOptions: ['10', '25', '50', '100'],
          onShowSizeChange: (_, size) => setPageSize(size),
        }}
        scroll={{ x: 1200 }}
        size="middle"
        bordered
      />
    </Card>
  );
};