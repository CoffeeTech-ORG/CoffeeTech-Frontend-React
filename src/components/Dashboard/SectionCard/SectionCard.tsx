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

  const getGrowthStageIcon = (type: string) => {
    // Map display names back to internal keys for icon lookup
    const displayNameToKey: Record<string, string> = {
      'Plántula': 'plantula',
      'Vegetativo': 'vegetativo',
      'Floración': 'floracion',
      'Fructificación': 'fructificacion',
      'Maduración': 'maduracion',
      'Cosecha': 'cosecha'
    };

    // Map growth stages to icons
    const iconMap: Record<string, string> = {
      plantula: '🌱',
      vegetativo: '🌿',
      floracion: '🌸',
      fructificacion: '🍃',
      maduracion: '🟡',
      cosecha: '☕'
    };

    const key = displayNameToKey[type] || type.toLowerCase();
    return iconMap[key] || '🌿';
  };

  const getGrowthStageName = (type: string) => {
    // If it's already a display name, return it
    const displayNames = ['Plántula', 'Vegetativo', 'Floración', 'Fructificación', 'Maduración', 'Cosecha'];
    if (displayNames.includes(type)) {
      return type;
    }

    // Otherwise, map from internal key to display name
    const nameMap: Record<string, string> = {
      plantula: 'Plántula',
      vegetativo: 'Vegetativo',
      floracion: 'Floración',
      fructificacion: 'Fructificación',
      maduracion: 'Maduración',
      cosecha: 'Cosecha'
    };
    return nameMap[type] || type;
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
          <span className="growth-stage__icon">{getGrowthStageIcon(section.type)}</span>
          <span className="growth-stage__name">{getGrowthStageName(section.type)}</span>
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