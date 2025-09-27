import React from 'react';
import { useSectionData } from '../../hooks/useSectionData';
import { CardData } from './CardData';
import { RecommendationList } from './RecommendationList';
import { Section } from '../../types/api.types';
import { useI18n } from '../../contexts/I18nContext';
import './SectionData.scss';

interface SectionDataProps {
  authToken: string | null;
  section: Section;
  onClose?: () => void;
}

export const SectionData: React.FC<SectionDataProps> = ({ authToken, section, onClose }) => {
  const { t } = useI18n();
  const {
    loading,
    error,
    assignments,
    selectedAssignment,
    device,
    dataRecord,
    recommendations,
    refresh,
    setToken,
    selectAssignment
  } = useSectionData(authToken, section.id);

  React.useEffect(() => {
    if (authToken) {
      setToken(authToken);
    }
  }, [authToken]);

  const getSectionIcon = (type: string) => {
    const typeMap: Record<string, string> = {
      [t('sectionType.plantula')]: '/src/assets/section_icons/plantula.png',
      [t('sectionType.vegetativo')]: '/src/assets/section_icons/vegetativo.png',
      [t('sectionType.floracion')]: '/src/assets/section_icons/floracion.png',
      [t('sectionType.fructificacion')]: '/src/assets/section_icons/fructificacion.png',
      [t('sectionType.maduracion')]: '/src/assets/section_icons/maduracion.png',
      [t('sectionType.cosecha')]: '/src/assets/section_icons/cosecha.png',
      // Mantener compatibilidad con valores en español
      'Plántula': '/src/assets/section_icons/plantula.png',
      'Vegetativo': '/src/assets/section_icons/vegetativo.png',
      'Floración': '/src/assets/section_icons/floracion.png',
      'Fructificación': '/src/assets/section_icons/fructificacion.png',
      'Maduración': '/src/assets/section_icons/maduracion.png',
      'Cosecha': '/src/assets/section_icons/cosecha.png'
    };
    return typeMap[type] || '/src/assets/section_icons/vegetativo.png';
  };

  return (
    <div className="section-data">
      <div className="section-data__header">
        <div className="header-left">
          <img 
            src={getSectionIcon(section.type)} 
            alt={section.type}
            className="section-icon"
          />
          <div className="section-info">
            <h3>{section.name}</h3>
            <div className="section-type">{t('sectionData.type')}: {section.type}</div>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="refresh-btn"
            onClick={() => refresh()} 
            disabled={loading}
          >
            {loading ? t('common.loading') : t('common.refresh')}
          </button>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              {t('common.close')}
            </button>
          )}
        </div>
      </div>

      {loading && <div className="loading-state">{t('sectionData.loading')}</div>}

      {error && (
        <div className="error-state">
          <div className="error-message">{t('common.error')}: {String(error.message ?? error)}</div>
        </div>
      )}

      {!loading && !error && (
        <div className="section-content">
          <div className="content-section assignments-section">
            <h4>{t('sectionData.assignedDevice')}</h4>
            {assignments.length === 0 && (
              <div className="no-device">{t('sectionData.noDevice')}</div>
            )}
            {assignments.length > 1 && (
              <div className="assignment-selector">
                <select 
                  value={String(selectedAssignment?.id ?? '')} 
                  onChange={e => selectAssignment(e.target.value)}
                >
                  {assignments.map(a => (
                    <option key={String(a.id)} value={String(a.id)}>
                      {`${t('sectionData.device')} ${a.deviceId} (${t('sectionData.assignment')} ${a.id})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {assignments.length === 1 && device && (
              <div className="device-info">
                {t('sectionData.deviceHubId')}: {device.deviceHubId || t('sectionData.notAvailable')}
              </div>
            )}
            {assignments.length === 1 && !device && (
              <div className="device-info">{t('sectionData.device')}: {assignments[0].deviceId}</div>
            )}
          </div>

          <div className="content-section">
            <CardData data={dataRecord} />
          </div>

          <div className="content-section">
            <RecommendationList items={recommendations} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionData;
