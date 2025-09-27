import React, { useState, useMemo, useEffect } from 'react';
import { useSensors } from '../../hooks/useSensors';
import { SensorFilters } from '../../types/sensor.types';
import { SensorCard } from './SensorCard/SensorCard';
import { SensorStatsCard } from './SensorStatsCard/SensorStatsCard';
import { SensorFiltersPanel } from './SensorFiltersPanel/SensorFiltersPanel';
import { useI18n } from '../../contexts/I18nContext';
import './SensorInventory.scss';

export const SensorInventory: React.FC = () => {
  const { t } = useI18n();
  const { 
    sensors, 
    loading, 
    error, 
    refetch, 
    addSensor, 
    updateSensor, 
    deleteSensor, 
    getSensorStats, 
    filterSensors 
  } = useSensors();

  const [filters, setFilters] = useState<SensorFilters>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Force grid view on mobile screens
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth <= 768 && viewMode === 'list') {
        setViewMode('grid');
      }
    };

    // Check initially
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [viewMode]);

  const filteredSensors = useMemo(() => {
    return filterSensors(filters);
  }, [filterSensors, filters]);

  const sensorStats = useMemo(() => {
    return getSensorStats();
  }, [getSensorStats]);

  const handleFilterChange = (newFilters: SensorFilters) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="sensor-inventory">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('sensors.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sensor-inventory">
        <div className="error-message">
          <h3>{t('sensors.error.loading')}</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            {t('sensors.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sensor-inventory">
      <div className="inventory-header">
        <div className="header-title">
          <h1>{t('sensors.inventory.title')}</h1>
          <p>{t('sensors.inventory.description')}</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleRefresh}
            className="refresh-btn"
            disabled={loading}
          >
            🔄 {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-section">
        <SensorStatsCard stats={sensorStats} />
      </div>

      {/* Filters Panel */}
      <div className="filters-section">
        <SensorFiltersPanel 
          filters={filters}
          onFiltersChange={handleFilterChange}
          resultCount={filteredSensors.length}
          totalCount={sensors.length}
        />
      </div>

      {/* View Controls */}
      <div className="view-controls">
        <div className="view-mode-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            📱 {t('sensors.view.grid')}
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 {t('sensors.view.list')}
          </button>
        </div>
      </div>

      {/* Sensors List */}
      <div className={`sensors-container ${viewMode}`}>
        {filteredSensors.length === 0 ? (
          <div className="no-sensors">
            <div className="no-sensors-icon">📡</div>
            <h3>{t('sensors.noSensorsFound')}</h3>
            <p>
              {sensors.length === 0 
                ? t('sensors.getStarted') 
                : t('sensors.adjustFilters')}
            </p>
          </div>
        ) : (
          <div className={`sensors-grid ${viewMode}`}>
            {filteredSensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                onUpdate={updateSensor}
                onDelete={deleteSensor}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};