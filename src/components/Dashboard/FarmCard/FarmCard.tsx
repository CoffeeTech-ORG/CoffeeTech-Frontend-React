import React from 'react';
import { MapPin, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { Farm } from '../../../services/farms.service';
import './FarmCard.scss';

interface FarmCardProps {
  farm: Farm;
  onViewDetails?: (farmId: string) => void;
  onEdit?: (farmId: string) => void;
  onDelete?: (farmId: string) => void;
}

export const FarmCard: React.FC<FarmCardProps> = ({ 
  farm, 
  onViewDetails,
  onEdit,
  onDelete 
}) => {
  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return '#52c41a';
    if (percentage >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getHealthIcon = (status: Farm['status']) => {
    switch (status) {
      case 'warning':
        return <AlertTriangle size={16} className="status-icon warning" />;
      case 'critical':
        return <AlertTriangle size={16} className="status-icon critical" />;
      default:
        return null;
    }
  };

  return (
    <div className="farm-card">
      <div className="farm-card__header">
        <div className="farm-card__title">
          {getHealthIcon(farm.status)}
          <h3>{farm.name}</h3>
        </div>
        
        <div className="farm-card__actions">
          <button 
            className="action-btn"
            onClick={() => onViewDetails?.(farm.id)}
          >
            <MapPin size={16} />
          </button>
          <button 
            className="action-btn"
            onClick={() => onEdit?.(farm.id)}
          >
            <Edit size={16} />
          </button>
          <button 
            className="action-btn"
            onClick={() => onDelete?.(farm.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <p className="farm-card__location">{farm.location}</p>
      
    </div>
  );
};