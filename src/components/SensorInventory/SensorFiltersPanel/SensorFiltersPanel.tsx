import React, { useState, useEffect } from 'react';
import { SensorFilters, SensorStatus, SensorType } from '../../../types/sensor.types';
import './SensorFiltersPanel.scss';

interface SensorFiltersPanelProps {
  filters: SensorFilters;
  onFiltersChange: (filters: SensorFilters) => void;
  resultCount: number;
  totalCount: number;
}

const SENSOR_STATUSES: SensorStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR'];
const SENSOR_TYPES: SensorType[] = [
  'COMBINED', 
  'TEMPERATURE', 
  'HUMIDITY', 
  'SOIL_MOISTURE', 
  'LIGHT', 
  'PH', 
  'CONDUCTIVITY'
];

export const SensorFiltersPanel: React.FC<SensorFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  resultCount,
  totalCount
}) => {
  const [localFilters, setLocalFilters] = useState<SensorFilters>(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof SensorFilters, value: string | undefined) => {
    const newFilters = {
      ...localFilters,
      [key]: value === '' ? undefined : value
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== undefined && value !== '');

  return (
    <div className="sensor-filters-panel">
      <div className="filters-header">
        <div className="filters-title">
          <h3>Filters</h3>
          <div className="results-count">
            Showing {resultCount} of {totalCount} sensors
          </div>
        </div>
        <div className="filters-actions">
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="clear-filters-btn"
            >
              Clear All
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      <div className={`filters-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="filters-row">
          {/* Search */}
          <div className="filter-group">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search sensors..."
              value={localFilters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="search-input"
            />
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={localFilters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value as SensorStatus)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              {SENSOR_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="filter-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              value={localFilters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value as SensorType)}
              className="filter-select"
            >
              <option value="">All Types</option>
              {SENSOR_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="filter-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              placeholder="Filter by location..."
              value={localFilters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        {/* Quick Status Filters */}
        <div className="quick-filters">
          <div className="quick-filters-label">Quick filters:</div>
          <div className="quick-filter-buttons">
            {SENSOR_STATUSES.map(status => (
              <button
                key={status}
                onClick={() => handleFilterChange('status', 
                  localFilters.status === status ? undefined : status
                )}
                className={`quick-filter-btn ${
                  localFilters.status === status ? 'active' : ''
                } ${status.toLowerCase()}`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};