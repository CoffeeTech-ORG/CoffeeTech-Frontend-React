import React, { useState, useEffect } from 'react';
import { Sensor } from '../../types/sensor.types';
import { sensorService } from '../../services/sensor.service';
import './SensorDetailView.scss';

interface SensorDetailViewProps {
  sensorId: number;
  onClose: () => void;
}

export const SensorDetailView: React.FC<SensorDetailViewProps> = ({
  sensorId,
  onClose
}) => {
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSensorDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const sensorData = await sensorService.getSensorById(sensorId);
        setSensor(sensorData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sensor details');
      } finally {
        setLoading(false);
      }
    };

    fetchSensorDetails();
  }, [sensorId]);

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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateUptime = (lastSeen: string): string => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="sensor-detail-view">
        <div className="detail-loading">
          <div className="spinner"></div>
          <p>Loading sensor details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sensor-detail-view">
        <div className="detail-error">
          <h3>Error loading sensor details</h3>
          <p>{error}</p>
          <button onClick={onClose} className="close-btn">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!sensor) {
    return (
      <div className="sensor-detail-view">
        <div className="detail-error">
          <h3>Sensor not found</h3>
          <p>The requested sensor could not be found.</p>
          <button onClick={onClose} className="close-btn">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sensor-detail-view">
      <div className="detail-header">
        <div className="header-info">
          <div className="sensor-icon-large">
            {getSensorTypeIcon(sensor.type)}
          </div>
          <div className="sensor-title">
            <h1>{sensor.sensorCode}</h1>
            <p className="sensor-type-label">{sensor.type.replace('_', ' ')} Sensor</p>
          </div>
        </div>
        <button onClick={onClose} className="close-detail-btn">
          ✕
        </button>
      </div>

      <div className="detail-content">
        {/* Status Overview */}
        <div className="detail-section">
          <h2>Status Overview</h2>
          <div className="status-cards">
            <div className="status-card">
              <div className="status-info">
                <span 
                  className="status-indicator-large"
                  style={{ color: getStatusColor(sensor.status) }}
                >
                  {getStatusIcon(sensor.status)}
                </span>
                <div className="status-details">
                  <h3 style={{ color: getStatusColor(sensor.status) }}>
                    {sensor.status}
                  </h3>
                  <p>Current Status</p>
                </div>
              </div>
            </div>
            
            <div className="uptime-card">
              <div className="uptime-info">
                <span className="uptime-icon">⏰</span>
                <div className="uptime-details">
                  <h3>{calculateUptime(sensor.lastSeen)}</h3>
                  <p>Last Seen</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sensor Information */}
        <div className="detail-section">
          <h2>Sensor Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Sensor ID</label>
              <div className="info-value monospace">{sensor.id}</div>
            </div>
            <div className="info-item">
              <label>MAC Address</label>
              <div className="info-value monospace">{sensor.sensorCode}</div>
            </div>
            <div className="info-item">
              <label>Type</label>
              <div className="info-value">{sensor.type.replace('_', ' ')}</div>
            </div>
            <div className="info-item">
              <label>Location</label>
              <div className="info-value">
                <span className="location-value">
                  📍 {sensor.location}
                </span>
              </div>
            </div>
            <div className="info-item">
              <label>Last Communication</label>
              <div className="info-value">{formatDate(sensor.lastSeen)}</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="detail-section">
          <h2>Recent Activity</h2>
          <div className="activity-timeline">
            <div className="activity-item">
              <div className="activity-icon">📊</div>
              <div className="activity-content">
                <h4>Last Data Transmission</h4>
                <p>{formatDate(sensor.lastSeen)}</p>
                <span className="activity-time">{calculateUptime(sensor.lastSeen)}</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">⚙️</div>
              <div className="activity-content">
                <h4>Status: {sensor.status}</h4>
                <p>Current operational status</p>
                <span className="activity-time">Updated automatically</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📍</div>
              <div className="activity-content">
                <h4>Location Verified</h4>
                <p>{sensor.location}</p>
                <span className="activity-time">Setup complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="detail-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-button primary">
              📊 View Data History
            </button>
            <button className="action-button secondary">
              ⚙️ Configure Settings
            </button>
            <button className="action-button secondary">
              🔧 Request Maintenance
            </button>
            <button className="action-button danger">
              ❌ Report Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};