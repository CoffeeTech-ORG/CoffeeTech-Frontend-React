import React from 'react';
import { DataRecord } from '../../types/api.types';
import { useI18n } from '../../contexts/I18nContext';
import './CardData.scss';

interface CardDataProps {
  data?: DataRecord | null;
}

export const CardData: React.FC<CardDataProps> = ({ data }) => {
  const { t } = useI18n();
  
  if (!data) {
    return (
      <div className="card-data">
        <div className="no-data">
          {t('cardData.noData')}
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
      <h4>{t('cardData.title')}</h4>
      <div className="last-update">
        {t('cardData.lastUpdated')}: {formatTimestamp(data.updatedAt || data.timestamp)}
      </div>
      
      <div className="sensor-data">
        <div className="data-item">
          <span className="data-label">{t('cardData.temperature')}</span>
          <span className={`data-value temperature ${data.celciusGradeTemperature === null ? 'no-data' : ''}`}>
            {formatValue(data.celciusGradeTemperature?.toFixed(2), ' °C')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">{t('cardData.airHumidity')}</span>
          <span className={`data-value humidity ${data.airHumidityPercent === null ? 'no-data' : ''}`}>
            {formatValue(data.airHumidityPercent?.toFixed(2), ' %')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">{t('cardData.soilHumidity')}</span>
          <span className={`data-value humidity ${data.soilHumidityPercent === null ? 'no-data' : ''}`}>
            {formatValue(data.soilHumidityPercent?.toFixed(2), ' %')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">{t('cardData.precipitation')}</span>
          <span className={`data-value precipitation`}>
            {data.precipitationDetected === 1 || data.precipitationDetected === true ? t('common.yes') : t('common.no')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">{t('cardData.nitrogen')}</span>
          <span className={`data-value nutrient ${data.nitrogen === null ? 'no-data' : ''}`}>
            {formatValue(data.nitrogen?.toFixed(2), ' mg/kg')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">{t('cardData.phosphorus')}</span>
          <span className={`data-value nutrient ${data.phosphorus === null ? 'no-data' : ''}`}>
            {formatValue(data.phosphorus?.toFixed(2), ' mg/kg')}
          </span>
        </div>
        
        <div className="data-item">
          <span className="data-label">{t('cardData.potassium')}</span>
          <span className={`data-value nutrient ${data.potassium === null ? 'no-data' : ''}`}>
            {formatValue(data.potassium?.toFixed(2), ' mg/kg')}
          </span>
        </div>
      </div>
    </div>
  );
};
