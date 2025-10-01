import React, { useState } from 'react';
import { Card, Radio, Row, Col, Typography, Space } from 'antd';
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
  ComposedChart,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { useI18n } from '../../../contexts/I18nContext';
import { ChartDataPoint } from '../../../types/report.types';

const { Title } = Typography;

type GrowthStage = 'plantula' | 'vegetativo' | 'floracion' | 'fructificacion' | 'maduracion' | 'cosecha' | 'default';

interface OptimalParams {
  N: [number, number];
  P: [number, number];
  K: [number, number];
  soil_hum: [number, number];
  temp: [number, number];
}

// Rangos óptimos por etapa de crecimiento
const STAGE_OPTIMAL_PARAMS: Record<GrowthStage, OptimalParams> = {
  plantula: { N: [30, 40], P: [20, 30], K: [25, 35], soil_hum: [70, 80], temp: [18, 25] },
  vegetativo: { N: [40, 60], P: [25, 35], K: [35, 50], soil_hum: [65, 75], temp: [18, 25] },
  floracion: { N: [40, 50], P: [35, 45], K: [50, 60], soil_hum: [65, 70], temp: [18, 25] },
  fructificacion: { N: [40, 50], P: [30, 40], K: [60, 80], soil_hum: [70, 75], temp: [17, 23] },
  maduracion: { N: [30, 40], P: [25, 35], K: [70, 90], soil_hum: [60, 70], temp: [17, 23] },
  cosecha: { N: [30, 40], P: [20, 30], K: [50, 70], soil_hum: [60, 70], temp: [18, 22] },
  default: { N: [35, 55], P: [20, 40], K: [40, 70], soil_hum: [60, 75], temp: [17, 26] },
};

interface ReportChartProps {
  data: ChartDataPoint[];
  dataType: 'all' | 'environmental' | 'soil' | 'nutrients';
  growthStage?: GrowthStage;
  style?: React.CSSProperties;
}

type ChartType = 'line' | 'area' | 'bar' | 'composed';
type NutrientFilter = 'all' | 'nitrogen' | 'phosphorus' | 'potassium';

export const ReportChart: React.FC<ReportChartProps> = ({ data, dataType, growthStage = 'default', style }) => {
  const { t } = useI18n();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [nutrientFilter, setNutrientFilter] = useState<NutrientFilter>('all');
  
  // Obtener los parámetros óptimos según la etapa de crecimiento
  const optimalParams = STAGE_OPTIMAL_PARAMS[growthStage];

  if (data.length === 0) {
    return (
      <Card title={t('reports.chart.title')} style={style}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          {t('reports.chart.noData')}
        </div>
      </Card>
    );
  }

  // Función para renderizar las líneas de referencia de rangos óptimos
  const renderOptimalRanges = () => {
    const ranges = [];

    // Mostrar rangos según el tipo de dato seleccionado
    if (dataType === 'all' || dataType === 'environmental') {
      // Área sombreada para rango óptimo de temperatura
      ranges.push(
        <ReferenceArea
          key="temp-area"
          y1={optimalParams.temp[0]}
          y2={optimalParams.temp[1]}
          fill="#ff4d4f"
          fillOpacity={0.1}
          stroke="none"
        />,
        <ReferenceLine
          key="temp-min"
          y={optimalParams.temp[0]}
          stroke="#ff4d4f"
          strokeDasharray="5 5"
          strokeWidth={1.5}
          label={{ 
            value: `Temp mín: ${optimalParams.temp[0]}°C`, 
            position: 'right',
            fill: '#ff4d4f',
            fontSize: 10,
            fontWeight: 'bold'
          }}
        />,
        <ReferenceLine
          key="temp-max"
          y={optimalParams.temp[1]}
          stroke="#ff4d4f"
          strokeDasharray="5 5"
          strokeWidth={1.5}
          label={{ 
            value: `Temp máx: ${optimalParams.temp[1]}°C`, 
            position: 'right',
            fill: '#ff4d4f',
            fontSize: 10,
            fontWeight: 'bold'
          }}
        />
      );
    }

    if (dataType === 'all' || dataType === 'soil') {
      // Área sombreada para rango óptimo de humedad del suelo
      ranges.push(
        <ReferenceArea
          key="soil-area"
          y1={optimalParams.soil_hum[0]}
          y2={optimalParams.soil_hum[1]}
          fill="#52c41a"
          fillOpacity={0.1}
          stroke="none"
        />,
        <ReferenceLine
          key="soil-min"
          y={optimalParams.soil_hum[0]}
          stroke="#52c41a"
          strokeDasharray="5 5"
          strokeWidth={1.5}
          label={{ 
            value: `Hum suelo mín: ${optimalParams.soil_hum[0]}%`, 
            position: 'right',
            fill: '#52c41a',
            fontSize: 10,
            fontWeight: 'bold'
          }}
        />,
        <ReferenceLine
          key="soil-max"
          y={optimalParams.soil_hum[1]}
          stroke="#52c41a"
          strokeDasharray="5 5"
          strokeWidth={1.5}
          label={{ 
            value: `Hum suelo máx: ${optimalParams.soil_hum[1]}%`, 
            position: 'right',
            fill: '#52c41a',
            fontSize: 10,
            fontWeight: 'bold'
          }}
        />
      );
    }

    if (dataType === 'all' || dataType === 'nutrients') {
      // Mostrar líneas según el filtro de nutriente seleccionado
      // Si es 'all' data type, mostrar todos los nutrientes
      const shouldShowNitrogen = dataType === 'all' || nutrientFilter === 'all' || nutrientFilter === 'nitrogen';
      const shouldShowPhosphorus = dataType === 'all' || nutrientFilter === 'all' || nutrientFilter === 'phosphorus';
      const shouldShowPotassium = dataType === 'all' || nutrientFilter === 'all' || nutrientFilter === 'potassium';
      
      if (shouldShowNitrogen) {
        ranges.push(
          <ReferenceArea
            key="n-area"
            y1={optimalParams.N[0]}
            y2={optimalParams.N[1]}
            fill="#faad14"
            fillOpacity={0.1}
            stroke="none"
          />,
          <ReferenceLine
            key="n-min"
            y={optimalParams.N[0]}
            stroke="#faad14"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ 
              value: `N mín: ${optimalParams.N[0]} mg/L`, 
              position: 'right',
              fill: '#faad14',
              fontSize: 10,
              fontWeight: 'bold'
            }}
          />,
          <ReferenceLine
            key="n-max"
            y={optimalParams.N[1]}
            stroke="#faad14"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ 
              value: `N máx: ${optimalParams.N[1]} mg/L`, 
              position: 'right',
              fill: '#faad14',
              fontSize: 10,
              fontWeight: 'bold'
            }}
          />
        );
      }
      
      if (shouldShowPhosphorus) {
        ranges.push(
          <ReferenceArea
            key="p-area"
            y1={optimalParams.P[0]}
            y2={optimalParams.P[1]}
            fill="#722ed1"
            fillOpacity={0.1}
            stroke="none"
          />,
          <ReferenceLine
            key="p-min"
            y={optimalParams.P[0]}
            stroke="#722ed1"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ 
              value: `P mín: ${optimalParams.P[0]} mg/L`, 
              position: 'right',
              fill: '#722ed1',
              fontSize: 10,
              fontWeight: 'bold'
            }}
          />,
          <ReferenceLine
            key="p-max"
            y={optimalParams.P[1]}
            stroke="#722ed1"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ 
              value: `P máx: ${optimalParams.P[1]} mg/L`, 
              position: 'right',
              fill: '#722ed1',
              fontSize: 10,
              fontWeight: 'bold'
            }}
          />
        );
      }
      
      if (shouldShowPotassium) {
        ranges.push(
          <ReferenceArea
            key="k-area"
            y1={optimalParams.K[0]}
            y2={optimalParams.K[1]}
            fill="#eb2f96"
            fillOpacity={0.1}
            stroke="none"
          />,
          <ReferenceLine
            key="k-min"
            y={optimalParams.K[0]}
            stroke="#eb2f96"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ 
              value: `K mín: ${optimalParams.K[0]} mg/L`, 
              position: 'right',
              fill: '#eb2f96',
              fontSize: 10,
              fontWeight: 'bold'
            }}
          />,
          <ReferenceLine
            key="k-max"
            y={optimalParams.K[1]}
            stroke="#eb2f96"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ 
              value: `K máx: ${optimalParams.K[1]} mg/L`, 
              position: 'right',
              fill: '#eb2f96',
              fontSize: 10,
              fontWeight: 'bold'
            }}
          />
        );
      }
    }

    return ranges;
  };

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
              {renderOptimalRanges()}
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
              {renderOptimalRanges()}
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
              {renderOptimalRanges()}
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
              {renderOptimalRanges()}
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
      // Si es 'all', mostrar todos los nutrientes sin filtro
      // Si es 'nutrients', aplicar el filtro de nutrientes
      const shouldShowNitrogen = dataType === 'all' || nutrientFilter === 'all' || nutrientFilter === 'nitrogen';
      const shouldShowPhosphorus = dataType === 'all' || nutrientFilter === 'all' || nutrientFilter === 'phosphorus';
      const shouldShowPotassium = dataType === 'all' || nutrientFilter === 'all' || nutrientFilter === 'potassium';
      
      if (type === 'area') {
        // Nitrógeno
        if (shouldShowNitrogen) {
          components.push(
            <Area 
              key="nitrogen"
              type="monotone" 
              dataKey="nitrogen" 
              stroke="#faad14" 
              fill="#faad14"
              fillOpacity={0.3}
              name="Nitrogen (mg/L)" 
            />
          );
        }
        // Fósforo
        if (shouldShowPhosphorus) {
          components.push(
            <Area 
              key="phosphorus"
              type="monotone" 
              dataKey="phosphorus" 
              stroke="#722ed1" 
              fill="#722ed1"
              fillOpacity={0.3}
              name="Phosphorus (mg/L)" 
            />
          );
        }
        // Potasio
        if (shouldShowPotassium) {
          components.push(
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
        }
      } else {
        // Nitrógeno
        if (shouldShowNitrogen) {
          components.push(
            <Line 
              key="nitrogen"
              type="monotone" 
              dataKey="nitrogen" 
              stroke="#faad14" 
              name="Nitrogen (mg/L)" 
              strokeWidth={2}
            />
          );
        }
        // Fósforo
        if (shouldShowPhosphorus) {
          components.push(
            <Line 
              key="phosphorus"
              type="monotone" 
              dataKey="phosphorus" 
              stroke="#722ed1" 
              name="Phosphorus (mg/L)" 
              strokeWidth={2}
            />
          );
        }
        // Potasio
        if (shouldShowPotassium) {
          components.push(
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
      // Si es 'all', mostrar todos los nutrientes sin filtro
      // Si es 'nutrients', aplicar el filtro de nutrientes
      const shouldShowNitrogen = dataType === 'all' || nutrientFilter === 'all' || nutrientFilter === 'nitrogen';
      const shouldShowPhosphorus = dataType === 'all' || nutrientFilter === 'all' || nutrientFilter === 'phosphorus';
      const shouldShowPotassium = dataType === 'all' || nutrientFilter === 'all' || nutrientFilter === 'potassium';
      
      // Nitrógeno
      if (shouldShowNitrogen) {
        components.push(
          <Bar key="nitrogen" dataKey="nitrogen" fill="#faad14" name="Nitrogen (mg/L)" />
        );
      }
      // Fósforo
      if (shouldShowPhosphorus) {
        components.push(
          <Bar key="phosphorus" dataKey="phosphorus" fill="#722ed1" name="Phosphorus (mg/L)" />
        );
      }
      // Potasio
      if (shouldShowPotassium) {
        components.push(
          <Bar key="potassium" dataKey="potassium" fill="#eb2f96" name="Potassium (mg/L)" />
        );
      }
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
            <Space>
              {/* Selector de nutriente cuando dataType es 'nutrients' */}
              {dataType === 'nutrients' && (
                <Radio.Group 
                  value={nutrientFilter} 
                  onChange={(e) => setNutrientFilter(e.target.value)}
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="all">Todos</Radio.Button>
                  <Radio.Button value="nitrogen">N</Radio.Button>
                  <Radio.Button value="phosphorus">P</Radio.Button>
                  <Radio.Button value="potassium">K</Radio.Button>
                </Radio.Group>
              )}
              
              {/* Selector de tipo de gráfico */}
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
            </Space>
          </Col>
        </Row>
      }
      style={style}
    >
      {renderChart()}
    </Card>
  );
};
