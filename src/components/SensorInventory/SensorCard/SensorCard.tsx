import React, { useState } from 'react';
import { Sensor, SensorFormData } from '../../../types/sensor.types';
import './SensorCard.scss';

interface SensorCardProps {
  sensor: Sensor;
  onUpdate: (id: number, data: Partial<SensorFormData>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  viewMode: 'grid' | 'list';
}

export const SensorCard: React.FC<SensorCardProps> = ({
  sensor,
  onUpdate,
  onDelete,
  viewMode
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'INACTIVE': return '#6b7280';
      case 'MAINTENANCE': return '#f59e0b';
      case 'ERROR': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'ACTIVE': return '✅';
      case 'INACTIVE': return '⚫';
      case 'MAINTENANCE': return '🔧';
      case 'ERROR': return '❌';
      default: return '⚫';
    }
  };

  const getSensorTypeIcon = (type: string): string => {
    switch (type) {
      case 'COMBINED': return '📊';
      case 'TEMPERATURE': return '🌡️';
      case 'PRECIPITATION': return '💧';
      case 'SOIL_MOISTURE': return '🌱';
      case 'NPK': return '☀️';
      case 'HUMIDITY': return '🧪';
      default: return '📡';
    }
  };

  const formatLastSeen = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = sensor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await onUpdate(sensor.id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete sensor ${sensor.sensorCode}?`)) {
      setIsDeleting(true);
      const success = await onDelete(sensor.id);
      if (!success) {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className={`sensor-card ${viewMode} ${sensor.status.toLowerCase()}`}>
      <div className="sensor-card-header">
        <div className="sensor-info">
          <div className="sensor-icon">
            {getSensorTypeIcon(sensor.type)}
          </div>
          <div className="sensor-details">
            <h3 className="sensor-code">{sensor.sensorCode}</h3>
            <p className="sensor-type">{sensor.type.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="sensor-actions">
          <button
            className="action-btn delete-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete sensor"
          >
            {isDeleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>

      <div className="sensor-card-body">
        <div className="sensor-status-row">
          <div className="status-info">
            <span 
              className="status-indicator"
              style={{ color: getStatusColor(sensor.status) }}
            >
              {getStatusIcon(sensor.status)}
            </span>
            <span className="status-text">{sensor.status}</span>
          </div>
          
          {sensor.status !== 'MAINTENANCE' && sensor.status !== 'ERROR' && (
            <button
              className={`status-toggle-btn ${sensor.status.toLowerCase()}`}
              onClick={handleStatusToggle}
              title={`Switch to ${sensor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}`}
            >
              {sensor.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </button>
          )}
        </div>

        <div className="sensor-last-seen">
          <span className="last-seen-label">Last seen:</span>
          <span className="last-seen-time">{formatLastSeen(sensor.lastSeen)}</span>
        </div>  
      </div>

      {viewMode === 'grid' && (
        <div className="sensor-card-footer">
          <div className="sensor-id">ID: {sensor.id}</div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="sensor-card-extra">
          <div className="sensor-id">ID: {sensor.id}</div>
          <div className="sensor-full-date">
            {new Date(sensor.lastSeen).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};