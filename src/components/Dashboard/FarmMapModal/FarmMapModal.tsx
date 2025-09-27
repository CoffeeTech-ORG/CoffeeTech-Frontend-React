import React, { useEffect, useRef, useState } from 'react';
import { Modal, Spin, Alert } from 'antd';
import { X, MapPin } from 'lucide-react';
import './FarmMapModal.scss';

// Definiciones de tipos para Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface FarmMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmName: string;
  location: string;
}

export const FarmMapModal: React.FC<FarmMapModalProps> = ({
  isOpen,
  onClose,
  farmName,
  location
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && location) {
      initializeMap();
    }
  }, [isOpen, location]);

  const initializeMap = async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar si Google Maps está disponible
      if (!window.google || !window.google.maps) {
        await loadGoogleMapsScript();
      }

      // Geocodificar la ubicación
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address: location }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const position = results[0].geometry.location;
          
          // Crear el mapa
          const map = new window.google.maps.Map(mapRef.current, {
            center: position,
            zoom: 15,
            mapTypeId: window.google.maps.MapTypeId.HYBRID, // Vista híbrida para ver mejor las fincas
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }]
              }
            ]
          });

          // Crear el marcador
          const marker = new window.google.maps.Marker({
            position: position,
            map: map,
            title: `${farmName} - ${location}`,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#20B2AA" stroke="#fff" stroke-width="2"/>
                  <circle cx="12" cy="10" r="3" fill="#fff"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 32)
            }
          });

          // Crear ventana de información
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #20B2AA;">${farmName}</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  <span style="display: inline-flex; align-items: center; gap: 4px;">
                    📍 ${location}
                  </span>
                </p>
              </div>
            `
          });

          // Mostrar la ventana de información al hacer clic en el marcador
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          // Mostrar la ventana de información por defecto
          infoWindow.open(map, marker);

          googleMapRef.current = map;
          markerRef.current = marker;
          setLoading(false);
        } else {
          setError('No se pudo encontrar la ubicación. Verifica la dirección.');
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Error al cargar el mapa. Inténtalo nuevamente.');
      setLoading(false);
    }
  };

  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        reject(new Error('Google Maps API key not found'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));

      document.head.appendChild(script);
    });
  };

  const handleClose = () => {
    // Limpiar referencias
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    if (googleMapRef.current) {
      googleMapRef.current = null;
    }
    setError(null);
    onClose();
  };

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={800}
      className="farm-map-modal"
      closable={false}
      destroyOnClose={true}
    >
      <div className="modal-header">
        <div className="modal-title-section">
          <MapPin className="modal-icon" size={24} />
          <div>
            <h2 className="modal-title">{farmName}</h2>
            <p className="modal-subtitle">{location}</p>
          </div>
        </div>
        <button
          className="close-btn"
          onClick={handleClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className="modal-content">
        {loading && (
          <div className="loading-container">
            <Spin size="large" />
            <p>Cargando mapa...</p>
          </div>
        )}
        
        {error && (
          <Alert
            message="Error al cargar el mapa"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div 
          ref={mapRef} 
          className="map-container"
          style={{ 
            height: '400px', 
            width: '100%',
            borderRadius: '8px',
            display: loading ? 'none' : 'block'
          }}
        />
      </div>
    </Modal>
  );
};