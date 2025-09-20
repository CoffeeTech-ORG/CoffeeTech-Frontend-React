import React from 'react';
import { SensorStats } from '../../../types/sensor.types';
import './SensorStatsCard.scss';

interface SensorStatsCardProps {
  stats: SensorStats;
}

export const SensorStatsCard: React.FC<SensorStatsCardProps> = ({ stats }) => {
  const getPercentage = (count: number): number => {
    return stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
  };

  const statsData = [
    {
      label: 'Total Sensors',
      value: stats.total,
      icon: '📡',
      color: '#3b82f6',
      bgColor: '#eff6ff'
    },
    {
      label: 'Active',
      value: stats.active,
      percentage: getPercentage(stats.active),
      icon: '✅',
      color: '#10b981',
      bgColor: '#ecfdf5'
    },
    {
      label: 'Inactive',
      value: stats.inactive,
      percentage: getPercentage(stats.inactive),
      icon: '⚫',
      color: '#6b7280',
      bgColor: '#f9fafb'
    },
    {
      label: 'Maintenance',
      value: stats.maintenance,
      percentage: getPercentage(stats.maintenance),
      icon: '🔧',
      color: '#f59e0b',
      bgColor: '#fffbeb'
    },
    {
      label: 'Error',
      value: stats.error,
      percentage: getPercentage(stats.error),
      icon: '❌',
      color: '#ef4444',
      bgColor: '#fef2f2'
    }
  ];

  return (
    <div className="sensor-stats-container">
      {statsData.map((stat, index) => (
        <div 
          key={index} 
          className="stat-card"
          style={{ 
            borderLeft: `4px solid ${stat.color}`,
            backgroundColor: stat.bgColor 
          }}
        >
          <div className="stat-icon" style={{ color: stat.color }}>
            {stat.icon}
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="stat-label">{stat.label}</div>
            {stat.percentage !== undefined && stats.total > 0 && (
              <div className="stat-percentage">
                {stat.percentage}%
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};