import React, { useState } from 'react';
import { Card, Radio, Row, Col, Typography } from 'antd';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { useI18n } from '../../../contexts/I18nContext';
import { ChartDataPoint } from '../../../types/report.types';

const { Title } = Typography;

interface ReportChartProps {
  data: ChartDataPoint[];
  dataType: 'all' | 'environmental' | 'soil' | 'nutrients';
  style?: React.CSSProperties;
}

type ChartType = 'line' | 'area' | 'bar' | 'composed';

export const ReportChart: React.FC<ReportChartProps> = ({ data, dataType, style }) => {
  const { t } = useI18n();
  const [chartType, setChartType] = useState<ChartType>('line');

  if (data.length === 0) {
    return (
      <Card title={t('reports.chart.title')} style={style}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          {t('reports.chart.noData')}
        </div>
      </Card>
    );
  }

  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height: 400,
      data: data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    const commonAxisProps = {
      xAxis: <XAxis dataKey="date" />,
      yAxis: <YAxis />,
      cartesianGrid: <CartesianGrid strokeDasharray="3 3" />,
      tooltip: <Tooltip />,
      legend: <Legend />
    };

    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={data}>
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.cartesianGrid}
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
              {renderDataLines('area')}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={data}>
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.cartesianGrid}
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
              {renderDataBars()}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer {...commonProps}>
            <ComposedChart data={data}>
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.cartesianGrid}
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
              {renderDataLines('line')}
              <Bar dataKey="precipitation" fill="#1890ff" yAxisId="right" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default: // line
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={data}>
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.cartesianGrid}
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
              {renderDataLines('line')}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderDataLines = (type: 'line' | 'area') => {
    const components = [];

    if (dataType === 'all' || dataType === 'environmental') {
      if (type === 'area') {
        components.push(
          <Area 
            key="temperature"
            type="monotone" 
            dataKey="temperature" 
            stroke="#ff4d4f" 
            fill="#ff4d4f"
            fillOpacity={0.3}
            name="Temperature (°C)" 
          />,
          <Area 
            key="airHumidity"
            type="monotone" 
            dataKey="airHumidity" 
            stroke="#1890ff" 
            fill="#1890ff"
            fillOpacity={0.3}
            name="Air Humidity (%)" 
          />
        );
      } else {
        components.push(
          <Line 
            key="temperature"
            type="monotone" 
            dataKey="temperature" 
            stroke="#ff4d4f" 
            name="Temperature (°C)" 
            strokeWidth={2}
          />,
          <Line 
            key="airHumidity"
            type="monotone" 
            dataKey="airHumidity" 
            stroke="#1890ff" 
            name="Air Humidity (%)" 
            strokeWidth={2}
          />
        );
      }
    }

    if (dataType === 'all' || dataType === 'soil') {
      if (type === 'area') {
        components.push(
          <Area 
            key="soilHumidity"
            type="monotone" 
            dataKey="soilHumidity" 
            stroke="#52c41a" 
            fill="#52c41a"
            fillOpacity={0.3}
            name="Soil Humidity (%)" 
          />
        );
      } else {
        components.push(
          <Line 
            key="soilHumidity"
            type="monotone" 
            dataKey="soilHumidity" 
            stroke="#52c41a" 
            name="Soil Humidity (%)" 
            strokeWidth={2}
          />
        );
      }
    }

    if (dataType === 'all' || dataType === 'nutrients') {
      if (type === 'area') {
        components.push(
          <Area 
            key="nitrogen"
            type="monotone" 
            dataKey="nitrogen" 
            stroke="#faad14" 
            fill="#faad14"
            fillOpacity={0.3}
            name="Nitrogen (mg/L)" 
          />,
          <Area 
            key="phosphorus"
            type="monotone" 
            dataKey="phosphorus" 
            stroke="#722ed1" 
            fill="#722ed1"
            fillOpacity={0.3}
            name="Phosphorus (mg/L)" 
          />,
          <Area 
            key="potassium"
            type="monotone" 
            dataKey="potassium" 
            stroke="#eb2f96" 
            fill="#eb2f96"
            fillOpacity={0.3}
            name="Potassium (mg/L)" 
          />
        );
      } else {
        components.push(
          <Line 
            key="nitrogen"
            type="monotone" 
            dataKey="nitrogen" 
            stroke="#faad14" 
            name="Nitrogen (mg/L)" 
            strokeWidth={2}
          />,
          <Line 
            key="phosphorus"
            type="monotone" 
            dataKey="phosphorus" 
            stroke="#722ed1" 
            name="Phosphorus (mg/L)" 
            strokeWidth={2}
          />,
          <Line 
            key="potassium"
            type="monotone" 
            dataKey="potassium" 
            stroke="#eb2f96" 
            name="Potassium (mg/L)" 
            strokeWidth={2}
          />
        );
      }
    }

    return components;
  };

  const renderDataBars = () => {
    const components = [];

    if (dataType === 'all' || dataType === 'environmental') {
      components.push(
        <Bar key="temperature" dataKey="temperature" fill="#ff4d4f" name="Temperature (°C)" />,
        <Bar key="airHumidity" dataKey="airHumidity" fill="#1890ff" name="Air Humidity (%)" />
      );
    }

    if (dataType === 'all' || dataType === 'soil') {
      components.push(
        <Bar key="soilHumidity" dataKey="soilHumidity" fill="#52c41a" name="Soil Humidity (%)" />
      );
    }

    if (dataType === 'all' || dataType === 'nutrients') {
      components.push(
        <Bar key="nitrogen" dataKey="nitrogen" fill="#faad14" name="Nitrogen (mg/L)" />,
        <Bar key="phosphorus" dataKey="phosphorus" fill="#722ed1" name="Phosphorus (mg/L)" />,
        <Bar key="potassium" dataKey="potassium" fill="#eb2f96" name="Potassium (mg/L)" />
      );
    }

    return components;
  };

  return (
    <Card 
      title={
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {t('reports.chart.title')}
            </Title>
          </Col>
          <Col>
            <Radio.Group 
              value={chartType} 
              onChange={(e) => setChartType(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="line">{t('reports.chart.types.line')}</Radio.Button>
              <Radio.Button value="area">{t('reports.chart.types.area')}</Radio.Button>
              <Radio.Button value="bar">{t('reports.chart.types.bar')}</Radio.Button>
              <Radio.Button value="composed">{t('reports.chart.types.mixed')}</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      }
      style={style}
    >
      {renderChart()}
    </Card>
  );
};
