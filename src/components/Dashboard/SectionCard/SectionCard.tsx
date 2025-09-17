import React from 'react';
import { MapPin, Info, Settings, AlertTriangle, Leaf } from 'lucide-react';
import { Section } from '../../../services/farms.service';
import './SectionCard.scss';

interface SectionCardProps {
  section: Section;
  onViewDetails?: (sectionId: string) => void;
  onSettings?: (sectionId: string) => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({ 
  section, 
  onViewDetails, 
  onSettings 
}) => {
  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return '#52c41a';
    if (percentage >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getHealthIcon = (status: Section['status']) => {
    switch (status) {
      case 'warning':
        return <AlertTriangle size={16} className="status-icon warning" />;
      case 'critical':
        return <AlertTriangle size={16} className="status-icon critical" />;
      default:
        return null;
    }
  };

  const getGrowthStageIcon = (stage: Section['growthStage']) => {
    // Map growth stages to icons
    const iconMap = {
      plantula: '🌱',
      vegetativo: '🌿',
      floracion: '🌸',
      fructificacion: '🍃',
      maduracion: '🟡',
      cosecha: '☕'
    };
    return iconMap[stage] || '🌿';
  };

  const getGrowthStageName = (stage: Section['growthStage']) => {
    const nameMap = {
      plantula: 'Plántula',
      vegetativo: 'Vegetativo',
      floracion: 'Floración',
      fructificacion: 'Fructificación',
      maduracion: 'Maduración',
      cosecha: 'Cosecha'
    };
    return nameMap[stage] || 'Unknown';
  };

  return (
    <div className="section-card">
      <div className="section-card__header">
        <div className="section-card__title">
          {getHealthIcon(section.status)}
          <h3>{section.name}</h3>
        </div>
        
        <div className="section-card__actions">
          <button 
            className="action-btn"
            onClick={() => onViewDetails?.(section.id)}
            title="View Location"
          >
            <MapPin size={16} />
          </button>
          <button 
            className="action-btn"
            onClick={() => onViewDetails?.(section.id)}
            title="View Details"
          >
            <Info size={16} />
          </button>
          <button 
            className="action-btn"
            onClick={() => onSettings?.(section.id)}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
      
      <div className="section-card__info">
        <div className="growth-stage">
          <span className="growth-stage__icon">{getGrowthStageIcon(section.growthStage)}</span>
          <span className="growth-stage__name">{getGrowthStageName(section.growthStage)}</span>
        </div>
        <div className="size-info">
          <Leaf size={14} />
          <span>{section.size} hectares</span>
        </div>
      </div>
      
      <div className="section-card__health">
        <div className="health-bar">
          <div 
            className="health-bar__fill"
            style={{ 
              width: `${section.healthPercentage}%`,
              backgroundColor: getHealthColor(section.healthPercentage)
            }}
          />
        </div>
        <div className="health-stats">
          <span 
            className="health-percentage"
            style={{ color: getHealthColor(section.healthPercentage) }}
          >
            {section.healthPercentage}%
          </span>
          <span className="health-label">Health</span>
        </div>
      </div>
      
      <div className="section-card__footer">
        <span className="last-update">
          Last updated: {new Date(section.lastUpdate).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};