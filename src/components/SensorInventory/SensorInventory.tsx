import React, { useState, useMemo, useEffect } from 'react';
import { useSensors } from '../../hooks/useSensors';
import { SensorFilters } from '../../types/sensor.types';
import { SensorCard } from './SensorCard/SensorCard';
import { SensorStatsCard } from './SensorStatsCard/SensorStatsCard';
import { SensorFiltersPanel } from './SensorFiltersPanel/SensorFiltersPanel';
import './SensorInventory.scss';

export const SensorInventory: React.FC = () => {
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
          <p>Loading sensor inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sensor-inventory">
        <div className="error-message">
          <h3>Error loading sensor inventory</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sensor-inventory">
      <div className="inventory-header">
        <div className="header-title">
          <h1>Sensor Inventory Management</h1>
          <p>Manage and monitor your sensor network</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleRefresh}
            className="refresh-btn"
            disabled={loading}
          >
            🔄 Refresh
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
            📱 Grid
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 List
          </button>
        </div>
      </div>

      {/* Sensors List */}
      <div className={`sensors-container ${viewMode}`}>
        {filteredSensors.length === 0 ? (
          <div className="no-sensors">
            <div className="no-sensors-icon">📡</div>
            <h3>No sensors found</h3>
            <p>
              {sensors.length === 0 
                ? "Get started by adding your first sensor" 
                : "Try adjusting your filters"}
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