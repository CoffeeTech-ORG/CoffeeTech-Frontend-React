import React from 'react';
import { Card, Row, Col, Statistic, Typography, Progress } from 'antd';
import { 
  ThermometerSun, 
  Droplets, 
  CloudRain, 
  Leaf,
  TrendingUp,
  Activity
} from 'lucide-react';
import type { ReportSummary } from '../../../types/report.types';

const { Text } = Typography;

interface ReportSummaryProps {
  summary: ReportSummary;
  style?: React.CSSProperties;
}

export const ReportSummaryComponent: React.FC<ReportSummaryProps> = ({ summary, style }) => {
  const getStatusColor = (value: number | undefined, optimal: [number, number]): string => {
    if (value === undefined) return '#d9d9d9';
    if (value >= optimal[0] && value <= optimal[1]) return '#52c41a';
    if (value >= optimal[0] - 5 && value <= optimal[1] + 5) return '#faad14';
    return '#ff4d4f';
  };

  const getHealthColor = (score?: number): string => {
    if (!score) return '#d9d9d9';
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <Card title="Report Summary" style={style}>
      <Row gutter={[24, 24]}>
        {/* Basic Stats */}
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="report-stat-card">
            <Statistic
              title="Total Data Points"
              value={summary.totalDataPoints}
              prefix={<Activity size={16} />}
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="report-stat-card">
            <Statistic
              title="Health Score"
              value={summary.healthScore || 0}
              suffix="/100"
              prefix={<TrendingUp size={16} />}
              valueStyle={{ 
                fontSize: '20px',
                color: getHealthColor(summary.healthScore)
              }}
            />
            {summary.healthScore && (
              <Progress 
                percent={summary.healthScore} 
                strokeColor={getHealthColor(summary.healthScore)}
                showInfo={false}
                size="small"
                style={{ marginTop: '8px' }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="report-stat-card">
            <Statistic
              title="Precipitation Days"
              value={summary.precipitationDays}
              prefix={<CloudRain size={16} />}
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>

        {/* Environmental Data */}
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="report-stat-card">
            <Statistic
              title="Avg Temperature"
              value={summary.averageTemperature?.toFixed(1) || '--'}
              suffix="°C"
              prefix={<ThermometerSun size={16} />}
              valueStyle={{ 
                fontSize: '20px',
                color: getStatusColor(summary.averageTemperature, [18, 25])
              }}
            />
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Optimal: 18-25°C
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card size="small" className="report-stat-card">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Air Humidity"
                  value={summary.averageAirHumidity?.toFixed(1) || '--'}
                  suffix="%"
                  prefix={<Droplets size={16} />}
                  valueStyle={{ 
                    fontSize: '16px',
                    color: getStatusColor(summary.averageAirHumidity, [70, 80])
                  }}
                />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  Optimal: 70-80%
                </Text>
              </Col>
              <Col span={12}>
                <Statistic
                  title="Soil Humidity"
                  value={summary.averageSoilHumidity?.toFixed(1) || '--'}
                  suffix="%"
                  prefix={<Leaf size={16} />}
                  valueStyle={{ 
                    fontSize: '16px',
                    color: getStatusColor(summary.averageSoilHumidity, [50, 70])
                  }}
                />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  Optimal: 50-70%
                </Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Nutrient Data */}
        <Col xs={24} sm={12} md={10}>
          <Card size="small" className="report-stat-card">
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '14px' }}>Nutrients (mg/L)</Text>
            </div>
            <div className="nutrients-grid">
              <div className="nutrient-item">
                <div className="nutrient-value" style={{ color: '#1890ff' }}>
                  {summary.averageNitrogen?.toFixed(1) || '--'}
                </div>
                <div className="nutrient-label">Nitrogen (N)</div>
              </div>
              <div className="nutrient-item">
                <div className="nutrient-value" style={{ color: '#52c41a' }}>
                  {summary.averagePhosphorus?.toFixed(1) || '--'}
                </div>
                <div className="nutrient-label">Phosphorus (P)</div>
              </div>
              <div className="nutrient-item">
                <div className="nutrient-value" style={{ color: '#faad14' }}>
                  {summary.averagePotassium?.toFixed(1) || '--'}
                </div>
                <div className="nutrient-label">Potassium (K)</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};
