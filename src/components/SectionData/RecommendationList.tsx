import React, { useState } from 'react';
import { Recommendation } from '../../types/api.types';
import { useI18n } from '../../contexts/I18nContext';
import './RecommendationList.scss';

interface RecommendationListProps {
  items?: Recommendation[];
}

export const RecommendationList: React.FC<RecommendationListProps> = ({ items = [] }) => {
  const { t } = useI18n();
  
  // Ordenar las recomendaciones del más reciente al más antiguo
  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      // Primero intentar ordenar por fecha de creación o actualización
      const dateA = a.createdAt || a.updatedAt || a.timestamp;
      const dateB = b.createdAt || b.updatedAt || b.timestamp;
      
      if (dateA && dateB) {
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      
      // Si no hay fechas, ordenar por ID (asumiendo que IDs más altos son más recientes)
      const idA = typeof a.id === 'number' ? a.id : parseInt(String(a.id), 10);
      const idB = typeof b.id === 'number' ? b.id : parseInt(String(b.id), 10);
      
      return idB - idA;
    });
  }, [items]);
  
  // Estado para manejar qué recomendaciones están expandidas
  const [expandedItems, setExpandedItems] = useState<Set<string | number>>(
    // La más reciente (primera en la lista) está expandida por defecto
    sortedItems.length > 0 ? new Set([sortedItems[0].id]) : new Set()
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
    const conditionMatch = description.match(/Condición detectada:\s([^\n\r]+)/i);
    if (conditionMatch) {
      return conditionMatch[1].trim().replace(/[.:;]+$/g, '');
    }

    // Extraer la etapa si no hay condición
    const stageMatch = description.match(/Etapa:\s([^\n\r]+)/i) || description.match(/Etapa:\s*([^]+)/i);
    if (stageMatch) {
      return stageMatch[1].trim();
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
        {sortedItems.map((r) => {
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
