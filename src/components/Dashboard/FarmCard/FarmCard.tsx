import React from 'react';
import { MapPin, AlertTriangle, Edit, Trash2, Mountain } from 'lucide-react';
import { Farm } from '../../../services/farms.service';
import { useAuth } from '../../../contexts/AuthContext';
import './FarmCard.scss';

interface FarmCardProps {
  farm: Farm;
  onViewDetails?: (farmId: string) => void;
  onEdit?: (farmId: string) => void;
  onDelete?: (farmId: string) => void;
  onViewMap?: (farmId: string) => void;
}

export const FarmCard: React.FC<FarmCardProps> = ({ 
  farm, 
  onViewDetails,
  onEdit,
  onDelete,
  onViewMap
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role?.id === 1;

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
    <div 
      className="farm-card"
      onClick={() => onViewDetails?.(farm.id)}
      style={{ cursor: onViewDetails ? 'pointer' : 'default' }}
    >
      <div className="farm-card__header">
        <div className="farm-card__title">
          {getHealthIcon(farm.status)}
          <h3>{farm.name}</h3>
        </div>
        
        <div className="farm-card__actions">
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewMap?.(farm.id);
            }}
          >
            <MapPin size={16} />
          </button>
          {isAdmin && (
            <>
              <button 
                className="action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(farm.id);
                }}
              >
                <Edit size={16} />
              </button>
              <button 
                className="action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(farm.id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <p className="farm-card__location"> <MapPin size={16} /> {farm.location}</p>
      <p className="farm-card__altitude"> <Mountain size={16} /> {farm.altitude.toFixed(2)} m</p>

    </div>
  );
};