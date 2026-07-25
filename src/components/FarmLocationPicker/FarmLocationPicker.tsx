import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Crosshair, MapPin, Pencil } from 'lucide-react';
import { PlaceSearch } from '../PlaceSearch/PlaceSearch';
import { MapView } from '../MapView/MapView';
import { FarmBoundaryEditor } from '../FarmBoundaryEditor/FarmBoundaryEditor';
import { LatLng } from '../MapView/BoundaryLayer';
import { formatArea } from '../../utils/geoArea';
import { reverseGeocode } from '../../services/geocoding.service';
import { LocationPrecision } from '../../services/farms.service';
import { useI18n } from '../../contexts/I18nContext';
import './FarmLocationPicker.scss';

export interface FarmLocation {
  location: string;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: LocationPrecision;
  /** The farm's drawn boundary, or `null` if none has been traced yet. */
  boundary: LatLng[] | null;
}

/** Starting value: an unlocated farm. */
export const EMPTY_FARM_LOCATION: FarmLocation = {
  location: '',
  latitude: null,
  longitude: null,
  locationPrecision: 'NONE',
  boundary: null
};

/**
 * `value` and `onChange` are optional because this component acts as the control of an antd
 * `Form.Item`, and antd injects them itself -- on the first render, with the field still empty, it
 * injects `value: undefined` and overrides whatever prop you pass.
 *
 * Taking them for granted left the edit modal blank with
 * `Cannot read properties of undefined (reading 'latitude')`.
 */
interface FarmLocationPickerProps {
  value?: FarmLocation;
  onChange?: (value: FarmLocation) => void;
  disabled?: boolean;
}

/**
 * Captures where a farm is.
 *
 * Coffee farms are in areas with no postal address. Google's autocomplete indexes businesses and
 * addresses, so for a plot on a San Ignacio hillside the closest it gets is the district, kilometres
 * from the spot. Hence three paths that all end at the same coordinate: "I'm at the farm" (device
 * GPS -- exact, no technical skill, but only useful on site, the farmer's natural path); search the
 * district and drag the pin over the plot in satellite view (works from home, how most farms are
 * registered); or stay on the district without adjusting (a valid state: enough for the weather).
 *
 * It also stores HOW the point was obtained. Without that mark, the map would claim the farm is in
 * the town square with the same confidence it shows the plot -- which is the bug the app already
 * had, only hidden.
 */
export const FarmLocationPicker: React.FC<FarmLocationPickerProps> = ({
  value: incoming,
  onChange,
  disabled
}) => {
  const { t } = useI18n();
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [drawingBoundary, setDrawingBoundary] = useState(false);

  // No `justSelectedPlace` flag needed here: `PlaceSearch` makes the two events mutually
  // exclusive, so nothing echoes `onChange` right after `onPlaceSelect` and erases the coordinate
  // just received.

  const value = incoming ?? EMPTY_FARM_LOCATION;
  const hasPoint = value.latitude != null && value.longitude != null;

  // `onChange` changes identity on every render of the parent form; keeping it in a ref stops the
  // map listeners from remounting in a loop. The wrapper absorbs the case where antd has not
  // injected it yet.
  const onChangeRef = useRef<(next: FarmLocation) => void>(() => {});
  useEffect(() => {
    onChangeRef.current = (next: FarmLocation) => onChange?.(next);
  }, [onChange]);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  /** Turns a point into readable text. Only fills the name if there is not one yet. */
  const fillNameFromPoint = useCallback(async (lat: number, lng: number) => {
    const label = await reverseGeocode(lat, lng);
    const current = valueRef.current;
    // On failure the field is left as-is: better empty than with invented text.
    if (label && !current.location?.trim()) {
      onChangeRef.current({ ...current, location: label });
    }
  }, []);

  /** Path 1: the device's GPS. */
  const useCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError(t('farm.location.noGeolocation'));
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onChangeRef.current({
          ...valueRef.current,
          latitude: lat,
          longitude: lng,
          locationPrecision: 'EXACT'
        });
        fillNameFromPoint(lat, lng);
        setLocating(false);
      },
      () => {
        // The browser does not reliably tell "denied" from "unavailable", and for the user the
        // way out is the same: use the search box.
        setLocateError(t('farm.location.locateFailed'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [fillNameFromPoint, t]);

  /** Moves the point and marks it as a deliberate assertion by the user. */
  const setPoint = useCallback((lat: number, lng: number) => {
    onChangeRef.current({
      ...valueRef.current,
      latitude: lat,
      longitude: lng,
      locationPrecision: 'EXACT',
    });
  }, []);

  return (
    <div className="farm-location-picker">
      <PlaceSearch
        value={value.location}
        placeholder={t('farm.location.placeholder')}
        disabled={disabled}
        onChange={(text) => {
          // Text typed by hand: any coordinate there describes another place, so it is discarded
          // -- and with it the boundary, drawn over that other coordinate.
          onChangeRef.current({
            ...valueRef.current,
            location: text,
            latitude: null,
            longitude: null,
            locationPrecision: 'NONE',
            boundary: null
          });
        }}
        onPlaceSelect={(place) => {
          onChangeRef.current({
            location: place.label,
            latitude: place.latitude,
            longitude: place.longitude,
            // The search box returns the district, not the plot. Approximate until someone
            // asserts it by dragging the pin or using GPS.
            locationPrecision: 'APPROXIMATE',
            // Another location, another place: the previous boundary no longer applies.
            boundary: null
          });
        }}
      />

      <div className="farm-location-picker__or">
        <span>{t('farm.location.or')}</span>
      </div>

      <button
        type="button"
        className="farm-location-picker__locate"
        onClick={useCurrentPosition}
        disabled={disabled || locating}
      >
        <Crosshair size={16} />
        {locating ? t('farm.location.locating') : t('farm.location.useCurrent')}
      </button>

      {locateError && (
        <p className="farm-location-picker__error" role="status">
          {locateError}
        </p>
      )}

      {value.locationPrecision === 'APPROXIMATE' && (
        <p className="farm-location-picker__note is-approximate">
          <AlertTriangle size={15} />
          {t('farm.location.approximateNote')}
        </p>
      )}

      {value.locationPrecision === 'EXACT' && hasPoint && (
        <p className="farm-location-picker__note is-exact">
          <CheckCircle2 size={15} />
          {t('farm.location.exactNote', {
            lat: (value.latitude as number).toFixed(4),
            lng: (value.longitude as number).toFixed(4)
          })}
        </p>
      )}

      {hasPoint ? (
        <>
          {/* Satélite si el punto ya es exacto —el agricultor reconoce su cafetal— y
              callejero si es aproximado: un satélite centrado en un distrito son sólo
              árboles, mientras el callejero al menos muestra pueblos y vías. */}
          <MapView
            latitude={value.latitude as number}
            longitude={value.longitude as number}
            zoom={value.locationPrecision === 'EXACT' ? 17 : 13}
            initialLayer={value.locationPrecision === 'EXACT' ? 'satellite' : 'street'}
            editable={!disabled}
            onPointChange={setPoint}
            boundary={value.boundary}
            height={220}
          />
          <p className="farm-location-picker__hint">{t('farm.location.dragHint')}</p>

          {/* El contorno es SIEMPRE opcional: al registrar se suele ir con prisa y puede no
              conocerse aún el lindero. Se invita, no se exige. La superficie ya dibujada se
              muestra en el propio botón, como confirmación de que quedó guardada. */}
          <button
            type="button"
            className="farm-location-picker__boundary"
            onClick={() => setDrawingBoundary(true)}
            disabled={disabled}
          >
            <Pencil size={16} aria-hidden="true" />
            {value.boundary && value.boundary.length >= 3
              ? t('boundary.editWithArea', { area: formatArea(value.boundary) })
              : t('boundary.draw')}
          </button>
        </>
      ) : (
        <p className="farm-location-picker__empty">
          <MapPin size={15} />
          {t('farm.location.emptyHint')}
        </p>
      )}

      {drawingBoundary && hasPoint && (
        <FarmBoundaryEditor
          latitude={value.latitude as number}
          longitude={value.longitude as number}
          initial={value.boundary}
          onSave={(ring) => {
            onChangeRef.current({ ...valueRef.current, boundary: ring });
            setDrawingBoundary(false);
          }}
          onClose={() => setDrawingBoundary(false)}
        />
      )}
    </div>
  );
};
