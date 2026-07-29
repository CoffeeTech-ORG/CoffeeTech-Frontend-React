import React from 'react';
import { Modal, Alert } from 'antd';
import { X, MapPin } from 'lucide-react';
import { MapView } from '../../MapView/MapView';
import { useI18n } from '../../../contexts/I18nContext';
import './FarmMapModal.scss';

interface FarmMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmName: string;
  location: string;
  /**
   * The farm's saved point. When it exists it is used as-is, without geocoding the text. Geocoding
   * a farm name -- "El señor de los Milagros" is not a place -- returns whatever fits best and the
   * map marks it with full confidence; so with no coordinate no map is drawn.
   */
  latitude?: number | null;
  longitude?: number | null;
  /** `APPROXIMATE` = the point is the district's, not the plot's. It has to be said. */
  locationPrecision?: string;
  /** The farm's drawn boundary; rendered over the map if it exists. */
  boundary?: [number, number][] | null;
}

/**
 * Shows where a farm is. Leaflet with OpenStreetMap and Esri tiles: both free and keyless, unlike
 * the Google API, which bills per use.
 */
export const FarmMapModal: React.FC<FarmMapModalProps> = ({
  isOpen,
  onClose,
  farmName,
  location,
  latitude = null,
  longitude = null,
  locationPrecision = 'NONE',
  boundary = null,
}) => {
  const { t } = useI18n();
  const hasPoint = latitude != null && longitude != null;

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
      className="farm-map-modal"
      closable={false}
      destroyOnHidden
    >
      <div className="modal-header">
        <div className="modal-title-section">
          <MapPin className="modal-icon" size={24} />
          <div>
            <h2 className="modal-title">{farmName}</h2>
            <p className="modal-subtitle">{location}</p>
          </div>
        </div>
        <button className="close-btn" onClick={onClose} aria-label={t('common.close')}>
          <X size={20} />
        </button>
      </div>

      <div className="modal-content">
        {!hasPoint && (
          <Alert
            message={t('farm.map.unlocated.title')}
            description={t('farm.map.unlocated.body')}
            type="info"
            showIcon
          />
        )}

        {hasPoint && locationPrecision === 'APPROXIMATE' && (
          <Alert
            message={t('farm.map.approximate.title')}
            description={t('farm.map.approximate.body')}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {hasPoint && (
          // Street map when the point is the district's: satellite centred there is just trees,
          // while the street map at least shows towns and roads.
          <MapView
            latitude={latitude as number}
            longitude={longitude as number}
            zoom={locationPrecision === 'EXACT' ? 16 : 12}
            initialLayer={locationPrecision === 'EXACT' ? 'satellite' : 'street'}
            boundary={boundary}
            height={400}
          />
        )}
      </div>
    </Modal>
  );
};
