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
      return new Date(String(timestamp)).toLocaleString('es-ES', {
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

  const formatValue = (value: number | null | undefined, unit = '') => {
    if (value === null || value === undefined) return '—';
    return `${value}${unit}`;
  };

  return (
    <div className="card-data">
      <h4>Datos del sensor</h4>
      <div className="last-update">
        Último registro: {formatTimestamp(data.timestamp)}
      </div>
      
      <div className="sensor-data">
        <div className="data-item">
          <span className="data-label">Temperatura</span>
          <span className={`data-value temperature ${data.celsiusGradeTemperature === null ? 'no-data' : ''}`}>
            {formatValue(data.celsiusGradeTemperature, ' °C')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Humedad aire</span>
          <span className={`data-value humidity ${data.airHumidityPercent === null ? 'no-data' : ''}`}>
            {formatValue(data.airHumidityPercent, ' %')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Humedad suelo</span>
          <span className={`data-value humidity ${data.soilHumidityPercent === null ? 'no-data' : ''}`}>
            {formatValue(data.soilHumidityPercent, ' %')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Precipitación</span>
          <span className={`data-value precipitation`}>
            {data.precipitationDetected ? 'Sí' : 'No'}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Nitrógeno</span>
          <span className={`data-value nutrient ${data.nitrogen === null ? 'no-data' : ''}`}>
            {formatValue(data.nitrogen, ' mg/kg')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Fósforo</span>
          <span className={`data-value nutrient ${data.phosphorus === null ? 'no-data' : ''}`}>
            {formatValue(data.phosphorus, ' mg/kg')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">Potasio</span>
          <span className={`data-value nutrient ${data.potassium === null ? 'no-data' : ''}`}>
            {formatValue(data.potassium, ' mg/kg')}
          </span>
        </div>
      </div>
    </div>
  );
};
