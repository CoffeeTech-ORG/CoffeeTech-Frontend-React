import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useI18n } from '../../contexts/I18nContext';
import { SATELLITE, SATELLITE_OVERLAYS, STREET } from './tileProviders';
import { BoundaryLayer, BoundaryController, LatLng } from './BoundaryLayer';
import './MapView.scss';

export type BaseLayer = 'street' | 'satellite';

/**
 * Same vocabulary as `FarmTier`, so map and cards agree. `unknown` means the farm exists but its
 * tier could not be computed; without it those pins would go green and claim a calm nobody checked.
 */
export type MarkerTone = 'crop' | 'device' | 'setup' | 'ok' | 'unknown';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  tone: MarkerTone;
  /** Shown on hover or tap; it is what identifies the pin. */
  label: string;
  /**
   * Card opened by tapping the pin. When present it replaces `onClick`: navigating straight from
   * the map means hitting the right pin first time, with no way to check which one it is.
   */
  popup?: React.ReactNode;
  onClick?: () => void;
  /** The farm's boundary, if drawn: rendered as a polygon next to the pin. */
  boundary?: LatLng[] | null;
}

/** Read-only boundary style. Same terracotta as the editor and the farm pin: one plot. */
const BOUNDARY_STYLE: L.PathOptions = {
  color: '#e0742f',
  weight: 2,
  fillColor: '#e0742f',
  fillOpacity: 0.12,
  interactive: false,
};

/**
 * Own marker as an SVG data URI. Leaflet's default icons are referenced by relative path and
 * break when bundled with Vite; a data URI does not depend on the bundler.
 */
const makePin = (fill: string, size = 34) =>
  L.icon({
    iconUrl:
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${fill}" stroke="#fff" stroke-width="2"/>
        <circle cx="12" cy="10" r="3.2" fill="#fff"/>
      </svg>`),
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    // Without this the popup anchors at the pin's TIP and opens over it, hiding what was just
    // tapped. `-size` lifts it to the head; the extra 8 px keep it off the pin.
    popupAnchor: [0, -size - 8],
  });

const pinIcon = makePin('#24472d');

/**
 * One colour per tier, shared with the cards and the list groups: a pin and its card match, so
 * moving between map and list needs no reinterpretation.
 */
const TONE_PINS: Record<MarkerTone, L.Icon> = {
  crop: makePin('#e0742f'),
  device: makePin('#9a6b12'),
  setup: makePin('#9aa2ac'),
  ok: makePin('#3a7d52'),
  // Brand green, same as the generic point: says "a farm is here" and nothing more.
  unknown: pinIcon,
};

/**
 * The same pin, larger, for the farm hovered in the list. With the map pinned alongside it ties
 * the two halves of the screen together without hunting among nine identical pins.
 */
const TONE_PINS_LG: Record<MarkerTone, L.Icon> = {
  crop: makePin('#e0742f', 46),
  device: makePin('#9a6b12', 46),
  setup: makePin('#9aa2ac', 46),
  ok: makePin('#3a7d52', 46),
  unknown: makePin('#24472d', 46),
};

/**
 * Recentres the map when the point changes from OUTSIDE: the GPS button, or a search result.
 *
 * `skip` suppresses the jump when the user moved the point themselves by dragging the pin or
 * tapping. Without it, every move recentres and resets the zoom, losing the view right after
 * the user has pointed at something.
 */
const Recenter: React.FC<{ lat: number; lng: number; zoom?: number; skip: React.MutableRefObject<boolean> }> = ({
  lat,
  lng,
  zoom,
  skip,
}) => {
  const map = useMap();
  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    map.setView([lat, lng], zoom ?? map.getZoom());
  }, [lat, lng, zoom, map, skip]);
  return null;
};

/** Tapping the map moves the pin: easier than dragging on a small screen. */
const ClickToPlace: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({
  onPick,
}) => {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

/**
 * Wheel zoom only while the pointer is over the map. Enabled everywhere, the wheel gets trapped
 * zooming while scrolling a long form; disabled everywhere, the first gesture anyone tries does
 * nothing.
 */
const WheelZoomOnHover: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const activar = () => map.scrollWheelZoom.enable();
    const desactivar = () => map.scrollWheelZoom.disable();

    map.scrollWheelZoom.disable();
    el.addEventListener('mouseenter', activar);
    el.addEventListener('mouseleave', desactivar);
    return () => {
      el.removeEventListener('mouseenter', activar);
      el.removeEventListener('mouseleave', desactivar);
    };
  }, [map]);
  return null;
};

/**
 * Frames the map around every pin. With farms spread across the sierra, any fixed centre and
 * zoom leaves half of them out.
 */
const FitToMarkers: React.FC<{ markers: MapMarker[] }> = ({ markers }) => {
  const map = useMap();
  const clave = markers.map((m) => `${m.latitude},${m.longitude}`).join('|');

  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      // With a single point `fitBounds` would go to maximum zoom and show one leaf of a tree.
      map.setView([markers[0].latitude, markers[0].longitude], 13);
      return;
    }
    map.fitBounds(
      markers.map((m) => [m.latitude, m.longitude] as [number, number]),
      { padding: [40, 40], maxZoom: 15 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, map]);

  return null;
};

/**
 * Hides the label layers while dragging or zooming.
 *
 * Measured on a 1523x1009 canvas, dragging 1.5 s, two passes per mode:
 *
 *              tiles   fps   ms/frame
 *   Street       56    50.5    20.8
 *   Satellite   110    22.3    45.9
 *
 * Satellite mounts four layers against one, and the overlays are PNGs with transparency.
 * `updateWhenIdle` + `keepBuffer` does not help: it avoids LOADING new tiles during the
 * gesture, but the ones already there are recomposed every frame anyway. Hiding them takes
 * ~70 elements out of the paint; the labels come back on release, which is when they are read.
 */
const HideLabelsWhileMoving: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    let timer: number | undefined;

    // Cleared by INACTIVITY, not by waiting for a `moveend`. Pairing `movestart` with `moveend`
    // breaks when switching Map/Satellite: the layers remount, the `moveend` never arrives, and
    // the class stays on with the labels hidden for good.
    //
    // `moveend`/`zoomend` count as recent activity rather than "restore now". Restoring the
    // instant a zoom ends shows the PREVIOUS level's tiles scaled up until the new ones arrive.
    const marcar = () => {
      el.classList.add('is-moving');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => el.classList.remove('is-moving'), 260);
    };

    map.on('movestart move zoomstart zoom moveend zoomend', marcar);
    return () => {
      map.off('movestart move zoomstart zoom moveend zoomend', marcar);
      window.clearTimeout(timer);
      el.classList.remove('is-moving');
    };
  }, [map]);
  return null;
};

/**
 * Satellite overlays (roads and labels): each is mounted only in its zoom range, set by
 * `showFrom`/`showTo` in `tileProviders.ts`.
 *
 * Bounding them with `maxZoom`/`minZoom` on the `TileLayer` does not hide them: `maxNativeZoom`
 * wins and it SCALES the layer instead of switching it off. A z11 label tile stretched to z15 is
 * magnified x16, so the town name appears huge and blurred over the correct one underneath.
 * Mounting per range leaves exactly one layer per zoom, nothing stretched.
 */
const SatelliteLabels: React.FC = () => {
  const map = useMap();
  const [z, setZ] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZ(map.getZoom()) });

  return (
    <>
      {SATELLITE_OVERLAYS.map((capa) => {
        if (z < (capa.showFrom ?? 0) || z > (capa.showTo ?? Infinity)) return null;

        return (
          <TileLayer
            key={capa.url}
            url={capa.url}
            attribution={capa.attribution}
            maxNativeZoom={capa.maxNativeZoom}
            maxZoom={capa.maxZoom}
            // `updateWhenIdle` stays: without it satellite dragging drops from ~55 to ~32 fps,
            // because Leaflet still creates and positions label tiles during the gesture even
            // when `HideLabelsWhileMoving` covers them.
            updateWhenIdle
            updateWhenZooming={false}
            keepBuffer={1}
          />
        );
      })}
    </>
  );
};

/**
 * Recomputes the map size when the container's changes.
 *
 * Leaflet measures its container once, on mount, and requests only the tiles covering that size.
 * Inside a modal that happens while the container is still zero, and the map stays convinced it
 * is tiny: measured, a 798x398 px canvas with a single tile. `ResizeObserver` rather than a
 * fixed `setTimeout`, which only works if the moment is guessed right.
 */
const KeepSized: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);
    // First pass after mount, in case the container already had its final size.
    map.invalidateSize();
    return () => observer.disconnect();
  }, [map]);
  return null;
};

interface MapViewProps {
  /** Single-point mode: location picker and single-farm map. */
  latitude?: number;
  longitude?: number;
  zoom?: number;
  /** Allows moving the point by dragging or tapping. Single-point mode only. */
  editable?: boolean;
  onPointChange?: (lat: number, lng: number) => void;
  /**
   * Multi-point mode: the dashboard map. When present it replaces the single point and the
   * framing is computed from the pins.
   */
  markers?: MapMarker[];
  /** Pin to enlarge: the farm hovered in the list. */
  highlightedId?: string | null;
  /**
   * Farm boundary in `[lat, lng]`. Without `drawBoundary` it renders read-only (dashboard map,
   * farm modal); with it, it can be drawn and edited.
   */
  boundary?: LatLng[] | null;
  drawBoundary?: boolean;
  onBoundaryChange?: (ring: LatLng[], closed: boolean) => void;
  boundaryController?: React.MutableRefObject<BoundaryController | null>;
  /** Initial layer. See the note below on why it depends on the accuracy. */
  initialLayer?: BaseLayer;
  height?: number | string;
}

/**
 * Base map shared by the location picker, the farm modal and the dashboard map.
 *
 * OpenStreetMap and Esri World Imagery: both free and keyless, unlike Google Maps which bills
 * per use. Attribution is visible on both layers because their licences require it.
 */
export const MapView: React.FC<MapViewProps> = ({
  latitude,
  longitude,
  zoom = 15,
  editable = false,
  onPointChange,
  markers,
  highlightedId,
  boundary,
  drawBoundary,
  onBoundaryChange,
  boundaryController,
  initialLayer = 'satellite',
  height = 220,
}) => {
  const { t } = useI18n();
  const [layer, setLayer] = useState<BaseLayer>(initialLayer);
  // Flags point changes originating INSIDE the map, so `Recenter` does not jump.
  const movedByUser = useRef(false);

  const reportPoint = useCallback(
    (lat: number, lng: number) => {
      movedByUser.current = true;
      onPointChange?.(lat, lng);
    },
    [onPointChange]
  );

  const varios = !!markers && markers.length > 0;
  // Starting centre. Irrelevant with several pins: `FitToMarkers` reframes once the map is
  // ready.
  const centro: [number, number] = varios
    ? [markers![0].latitude, markers![0].longitude]
    : [latitude ?? 0, longitude ?? 0];

  const markerHandlers = useMemo(
    () => ({
      dragend: (e: L.DragEndEvent) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        reportPoint(lat, lng);
      },
    }),
    [reportPoint]
  );

  return (
    <div className="map-view" style={{ height }}>
      <MapContainer
        center={centro}
        zoom={zoom}
        maxZoom={layer === 'street' ? STREET.maxZoom : SATELLITE.maxZoom}
        // Declared explicitly. Undeclared, Leaflet takes the LARGEST `minZoom` among its
        // layers, so the `minZoom: 9` that silences the CARTO labels would cap the whole map at
        // z9 and the zoom-out button stops responding past it.
        minZoom={3}
        className="map-view__canvas"
        // Handled by `WheelZoomOnHover`: on over the map, off outside it.
        scrollWheelZoom={false}
        // Off while placing the point (a double click moves the pin twice and zooms) and while
        // drawing the boundary, where the double click CLOSES the polygon. Zooming as well would
        // leave the boundary never closed and impossible to save.
        doubleClickZoom={!editable && !drawBoundary}
      >
        {layer === 'street' ? (
          <TileLayer
            url={STREET.url}
            attribution={STREET.attribution}
            maxNativeZoom={STREET.maxNativeZoom}
            maxZoom={STREET.maxZoom}
            updateWhenZooming={false}
          />
        ) : (
          <>
            {/* UNA sola fuente satelital, ampliada más allá de su resolución nativa. Antes
                había una segunda que entraba a partir de z=19; se retiró porque su imagen
                era medidamente peor y el cambio se percibía como una avería.

                La imagen de fondo SÍ sigue al dedo (`updateWhenIdle` por omisión en escritorio):
                es la que da la sensación de arrastrar el mapa. Las capas de encima no. */}
            <TileLayer
              url={SATELLITE.url}
              attribution={SATELLITE.attribution}
              maxNativeZoom={SATELLITE.maxNativeZoom}
              maxZoom={SATELLITE.maxZoom}
              updateWhenZooming={false}
            />
            {/* Vías y topónimos encima: sin esto el satélite es una mancha verde sin una sola
                referencia donde situarse.

                ── Por qué estas capas se actualizan sólo al soltar ──────────────────────────
                El satélite cuesta CUATRO capas de teselas contra una del callejero, y las tres
                de encima son PNG con transparencia, que además obligan a mezclar alfa. En un
                lienzo grande son cientos de <img> que el navegador tiene que recolocar en cada
                fotograma del arrastre — de ahí que el mapa vaya suelto en «Mapa» y a tirones en
                «Satélite» justo al agrandarlo.

                `updateWhenIdle` deja de crear y mover teselas de rótulos durante el gesto y las
                repone al soltar; `keepBuffer: 1` reduce el anillo de teselas fuera de pantalla
                que se conserva (2 por omisión). El fondo se excluye a propósito: si se congela
                la imagen, deja de parecer que arrastras el mapa. */}
            <SatelliteLabels />
          </>
        )}

        {/* Contornos de las fincas que lo tienen, debajo de las chinchetas. Sólo lectura: en el
            panel y el modal se ven, se dibujan en el editor. */}
        {varios &&
          markers!.map(
            (m) =>
              m.boundary &&
              m.boundary.length >= 3 && (
                <Polygon key={`b-${m.id}`} positions={m.boundary} pathOptions={BOUNDARY_STYLE} />
              )
          )}

        {varios ? (
          markers!.map((m) => (
            <Marker
              key={m.id}
              position={[m.latitude, m.longitude]}
              icon={(highlightedId === m.id ? TONE_PINS_LG : TONE_PINS)[m.tone]}
              // The card opens on tap; `onClick` is only used when there is no card.
              eventHandlers={!m.popup && m.onClick ? { click: m.onClick } : undefined}
              zIndexOffset={highlightedId === m.id ? 1000 : 0}
            >
              {/* Etiqueta Y ficha, no una u otra. Al pasar por encima hace falta saber CUÁL es
                  cada chincheta sin abrir nada — con nueve iguales, sin esto hay que ir
                  abriéndolas de una en una. La ficha llega después, al tocar.

                  `permanent: false`: todos los nombres a la vez taparían el mapa. */}
              <Tooltip
                direction="top"
                offset={[0, highlightedId === m.id ? -52 : -40]}
                opacity={1}
                className="farm-pin-label"
              >
                {m.label}
              </Tooltip>
              {m.popup && (
                <Popup closeButton autoPan minWidth={220}>
                  {m.popup}
                </Popup>
              )}
            </Marker>
          ))
        ) : (
          <Marker
            position={centro}
            icon={pinIcon}
            draggable={editable}
            eventHandlers={editable ? markerHandlers : undefined}
          />
        )}

        <KeepSized />
        <HideLabelsWhileMoving />
        <WheelZoomOnHover />
        {varios ? (
          <FitToMarkers markers={markers!} />
        ) : (
          <Recenter
            lat={latitude ?? 0}
            lng={longitude ?? 0}
            zoom={zoom}
            skip={movedByUser}
          />
        )}
        {!varios && editable && onPointChange && <ClickToPlace onPick={reportPoint} />}
        {(drawBoundary || (boundary && boundary.length >= 3)) && (
          <BoundaryLayer
            boundary={boundary ?? null}
            draw={drawBoundary}
            onChange={onBoundaryChange}
            controllerRef={boundaryController}
          />
        )}
      </MapContainer>

      <div className="map-view__layers" role="group" aria-label={t('map.layer')}>
        <button
          type="button"
          className={`map-view__layer${layer === 'street' ? ' is-active' : ''}`}
          onClick={() => setLayer('street')}
          aria-pressed={layer === 'street'}
        >
          {t('map.layer.street')}
        </button>
        <button
          type="button"
          className={`map-view__layer${layer === 'satellite' ? ' is-active' : ''}`}
          onClick={() => setLayer('satellite')}
          aria-pressed={layer === 'satellite'}
        >
          {t('map.layer.satellite')}
        </button>
      </div>
    </div>
  );
};
