import React, { useState } from 'react';
import { Recommendation } from '../../types/api.types';
import { useI18n } from '../../contexts/I18nContext';
import './RecommendationList.scss';

interface RecommendationListProps {
  items?: Recommendation[];
}

export const RecommendationList: React.FC<RecommendationListProps> = ({ items = [] }) => {
  const { t } = useI18n();
  // Estado para manejar qué recomendaciones están expandidas
  const [expandedItems, setExpandedItems] = useState<Set<string | number>>(
    // La más reciente (primera en la lista) está expandida por defecto
    items.length > 0 ? new Set([items[0].id]) : new Set()
  );

  const toggleExpanded = (id: string | number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getUrgencyLevel = (description: string) => {
    const urgencyMatch = description.match(/Urgencia:\s*(\d+)\/5/i);
    if (urgencyMatch) {
      const level = parseInt(urgencyMatch[1]);
      if (level >= 4) return 'high';
      if (level >= 2) return 'medium';
      return 'low';
    }
    return 'medium';
  };

  const extractTitle = (description: string) => {
    // Extraer la condición de la descripción
    const conditionMatch = description.match(/Condición:\s*([^.]+)/);
    if (conditionMatch) {
      return conditionMatch[1].trim();
    }
    
    // Extraer la etapa si no hay condición
    const stageMatch = description.match(/\[Etapa:\s*([^\]]+)\]/);
    if (stageMatch) {
      return `Etapa: ${stageMatch[1]}`;
    }
    
    return t('recommendations.default');
  };

  if (!items.length) {
    return (
      <div className="recommendation-list">
        <div className="no-recommendations">
          {t('recommendations.noAvailable')}
        </div>
      </div>
    );
  }

  return (
    <div className="recommendation-list">
      <h4>{t('recommendations.title')}</h4>
      <div className="recommendations">
        {items.map((r) => {
          const isExpanded = expandedItems.has(r.id);
          const urgencyLevel = getUrgencyLevel(r.recommendationDescription || '');
          const title = extractTitle(r.recommendationDescription || '');
          
          return (
            <div 
              key={String(r.id)} 
              className={`recommendation-item priority-${urgencyLevel} ${isExpanded ? 'expanded' : 'collapsed'}`}
              onClick={() => toggleExpanded(r.id)}
            >
              <div className="recommendation-header">
                <div className="recommendation-title">
                  {title}
                </div>
                <div className="expand-indicator">
                  {isExpanded ? '−' : '+'}
                </div>
              </div>
              
              {isExpanded && r.recommendationDescription && (
                <div className="recommendation-description">
                  {r.recommendationDescription}
                </div>
              )}
              
            </div>
          );
        })}
      </div>
    </div>
  );
};
