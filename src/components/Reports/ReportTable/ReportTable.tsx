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
  const [page, setPage] = useState(1);
  const [searchClicked, setSearchClicked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const pageSizes = [10, 25, 50, 100];
  const total = filteredData.length;

  React.useEffect(() => {
    setFilteredData(data);
  }, [data]);

  // Check if mobile for responsive design
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
      width: isMobile ? 100 : 150,
      render: (timestamp) => dayjs(timestamp).format(isMobile ? 'MM/DD HH:mm' : 'MM/DD/YY HH:mm'),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Farm',
      dataIndex: 'farmName',
      key: 'farmName',
      width: isMobile ? 80 : 120,
      ellipsis: true,
    },
    {
      title: 'Section',
      dataIndex: 'sectionName',
      key: 'sectionName',
      width: isMobile ? 80 : 120,
      ellipsis: true,
    },
    {
      title: isMobile ? 'Temp' : 'Temperature',
      dataIndex: 'celsiusGradeTemperature',
      key: 'temperature',
      width: isMobile ? 70 : 100,
      align: 'center',
      render: (temp) => temp !== null && temp !== undefined ? (
        <Tag color={getTemperatureColor(temp)}>
          {temp.toFixed(1)}°{isMobile ? '' : 'C'}
        </Tag>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.celciusGradeTemperature || 0) - (b.celciusGradeTemperature || 0),
    },
    {
      title: isMobile ? 'Air H.' : 'Air Humidity',
      dataIndex: 'airHumidityPercent',
      key: 'airHumidity',
      width: isMobile ? 70 : 110,
      align: 'center',
      render: (humidity) => humidity !== null && humidity !== undefined ? (
        <Tag color={getHumidityColor(humidity, true)}>
          {humidity.toFixed(1)}%
        </Tag>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.airHumidityPercent || 0) - (b.airHumidityPercent || 0),
    },
    {
      title: isMobile ? 'Soil H.' : 'Soil Humidity',
      dataIndex: 'soilHumidityPercent',
      key: 'soilHumidity',
      width: isMobile ? 70 : 110,
      align: 'center',
      render: (humidity) => humidity !== null && humidity !== undefined ? (
        <Tag color={getHumidityColor(humidity, false)}>
          {humidity.toFixed(1)}%
        </Tag>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.soilHumidityPercent || 0) - (b.soilHumidityPercent || 0),
    },
    {
      title: isMobile ? 'Rain' : 'Precipitation',
      dataIndex: 'precipitationDetected',
      key: 'precipitation',
      width: isMobile ? 60 : 100,
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
      width: isMobile ? 50 : 80,
      align: 'center',
      render: (value) => value !== null && value !== undefined ? (
        <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: isMobile ? '10px' : 'inherit' }}>
          {value.toFixed(1)}
        </span>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.nitrogen || 0) - (b.nitrogen || 0),
    },
    {
      title: 'P',
      dataIndex: 'phosphorus',
      key: 'phosphorus',
      width: isMobile ? 50 : 80,
      align: 'center',
      render: (value) => value !== null && value !== undefined ? (
        <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: isMobile ? '10px' : 'inherit' }}>
          {value.toFixed(1)}
        </span>
      ) : <span style={{ color: '#d9d9d9' }}>--</span>,
      sorter: (a, b) => (a.phosphorus || 0) - (b.phosphorus || 0),
    },
    {
      title: 'K',
      dataIndex: 'potassium',
      key: 'potassium',
      width: isMobile ? 50 : 80,
      align: 'center',
      render: (value) => value !== null && value !== undefined ? (
        <span style={{ color: '#faad14', fontWeight: 'bold', fontSize: isMobile ? '10px' : 'inherit' }}>
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
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '12px' : '0'
          }}
        >
          <Title level={4} style={{ margin: 0, fontSize: isMobile ? '16px' : '18px' }}>
            Raw Data Table
          </Title>
          <Space 
            direction={isMobile ? 'vertical' : 'horizontal'} 
            size="small"
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            <Search
              placeholder={isMobile ? "Search..." : "Search farms, sections, or dates"}
              allowClear
              enterButton={<SearchOutlined />}
              size={isMobile ? "small" : "middle"}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
              style={{ width: isMobile ? '100%' : 250 }}
            />
            <Button 
              icon={<FilterOutlined />} 
              size={isMobile ? "small" : "middle"}
              style={{ width: isMobile ? '100%' : 'auto' }}
            >
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
          className: "custom-pagination",
          pageSizeOptions: isMobile ? [5, 10, 25] : pageSizes,
          showSizeChanger: !isMobile,
          size: isMobile ? 'small' : 'default',
          defaultPageSize: isMobile ? 5 : pageSizes[0],
          locale: { items_per_page: '/ pages' },
          defaultCurrent: page,
          showTotal: (total) => `Total: ${total}`,
          onShowSizeChange: (current, size) => {
            setSearchClicked(true)
            setPageSize(size)
          },
          current: page,
          onChange: (page, pageSize) => {
            setSearchClicked(true)
            setPage(page)
          },
          total: total,
          simple: isMobile,
          // showQuickJumper: !isMobile,
        }}
        scroll={{ x: 'max-content' }}
        size={isMobile ? "small" : "middle"}
        bordered={!isMobile}
      />
    </Card>
  );
};