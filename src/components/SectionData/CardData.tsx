import React from 'react';
import { DataRecord } from '../../types/api.types';
import './CardData.scss';

interface CardDataProps {
  data?: DataRecord | null;
}

export const CardData: React.FC<CardDataProps> = ({ data }) => {
  
  if (!data) {
    return (
      <div className="card-data">
        <div className="no-data">
          No hay datos del sensor disponibles
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string | number | null | undefined) => {
    if (!timestamp) return '—';
    try {
      const date = new Date(String(timestamp));
      // Check if the date is valid
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  const formatValue = (value: number | string | null | undefined, unit = '') => {
    if (value === null || value === undefined) return '—';
    return `${value}${unit}`;
  };

  return (
    <div className="card-data">
      <h4>Datos del sensor</h4>
      <div className="last-update">
        Último registro: {formatTimestamp(data.updatedAt || data.timestamp)}
      </div>
      
      <div className="sensor-data">
        <div className="data-item">
          <span className="data-label">Temperatura</span>
          <span className={`data-value temperature ${data.celciusGradeTemperature === null ? 'no-data' : ''}`}>
            {formatValue(data.celciusGradeTemperature?.toFixed(2), ' °C')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Humedad aire</span>
          <span className={`data-value humidity ${data.airHumidityPercent === null ? 'no-data' : ''}`}>
            {formatValue(data.airHumidityPercent?.toFixed(2), ' %')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Humedad suelo</span>
          <span className={`data-value humidity ${data.soilHumidityPercent === null ? 'no-data' : ''}`}>
            {formatValue(data.soilHumidityPercent?.toFixed(2), ' %')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Precipitación</span>
          <span className={`data-value precipitation`}>
            {data.precipitationDetected === 1 || data.precipitationDetected === true ? 'Sí' : 'No'}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Nitrógeno</span>
          <span className={`data-value nutrient ${data.nitrogen === null ? 'no-data' : ''}`}>
            {formatValue(data.nitrogen?.toFixed(2), ' mg/kg')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Fósforo</span>
          <span className={`data-value nutrient ${data.phosphorus === null ? 'no-data' : ''}`}>
            {formatValue(data.phosphorus?.toFixed(2), ' mg/kg')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Potasio</span>
          <span className={`data-value nutrient ${data.potassium === null ? 'no-data' : ''}`}>
            {formatValue(data.potassium?.toFixed(2), ' mg/kg')}
          </span>
        </div>
      </div>
    </div>
  );
};
