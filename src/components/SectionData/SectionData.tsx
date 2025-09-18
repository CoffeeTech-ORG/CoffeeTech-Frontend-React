import React from 'react';
import { useSectionData } from '../../hooks/useSectionData';
import { CardData } from './CardData';
import { RecommendationList } from './RecommendationList';
import { Section } from '../../types/api.types';
import './SectionData.scss';

interface SectionDataProps {
  authToken: string | null;
  section: Section;
  onClose?: () => void;
}

export const SectionData: React.FC<SectionDataProps> = ({ authToken, section, onClose }) => {
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
    setToken(authToken);
  }, [authToken, setToken]);

  const getSectionIcon = (type: string) => {
    const typeMap: Record<string, string> = {
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
            <div className="section-type">Tipo: {section.type}</div>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="refresh-btn"
            onClick={() => refresh()} 
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              Cerrar
            </button>
          )}
        </div>
      </div>

      {loading && <div className="loading-state">Cargando datos de la sección...</div>}

      {error && (
        <div className="error-state">
          <div className="error-message">Error: {String(error.message ?? error)}</div>
        </div>
      )}

      {!loading && !error && (
        <div className="section-content">
          <div className="content-section assignments-section">
            <h4>Dispositivo asignado</h4>
            {assignments.length === 0 && (
              <div className="no-device">No hay dispositivo asignado a esta sección.</div>
            )}
            {assignments.length > 1 && (
              <div className="assignment-selector">
                <select 
                  value={String(selectedAssignment?.id ?? '')} 
                  onChange={e => selectAssignment(e.target.value)}
                >
                  {assignments.map(a => (
                    <option key={String(a.id)} value={String(a.id)}>
                      {`Device ${a.deviceId} (Assignment ${a.id})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {assignments.length === 1 && device && (
              <div className="device-info">
                DeviceHubId: {device.deviceHubId || 'No disponible'}
              </div>
            )}
            {assignments.length === 1 && !device && (
              <div className="device-info">Device: {assignments[0].deviceId}</div>
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
