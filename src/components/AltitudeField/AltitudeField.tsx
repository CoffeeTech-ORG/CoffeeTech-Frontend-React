import React, { useEffect, useRef, useState } from 'react';
import { InputNumber } from 'antd';
import { useI18n } from '../../contexts/I18nContext';
import { elevationFor, elevationMismatch } from '../../services/elevation.service';
import './AltitudeField.scss';

/**
 * The farm's altitude, derived from the coordinates when possible.
 *
 * It decides more than it looks: the engine picks an ALTITUDE BAND from it, and the band changes the
 * weight of four pest and disease rules. Typed 1450 m at the pilot where the hub is at 1823, the
 * band comes out `medium` instead of `high`, dropping rust and borer from alert to warning and
 * reinforcing Phoma. One digit changes the diagnosis, with no way to notice.
 *
 * Once there is a coordinate it queries the 90 m elevation model -- the SAME one the engine uses to
 * correct temperature for altitude, so both numbers describe the same relief. An empty field is
 * FILLED; a value already typed WINS, because the grower knows where they put the equipment and the
 * map only smooths the relief, so it is compared and not overwritten; if the two differ by a lot it
 * WARNS, which means the coordinate and the altitude do not describe the same point -- hundreds of
 * metres, on a slope.
 *
 * Empty stays a valid answer: "I don't know" is honest and the backend can store it. The engine then
 * does not modulate by altitude, and states so in the message to the technician.
 */

/**
 * Plausible altitude window for a coffee plot, in metres. The same the engine applies
 * (`COFFEE_ALTITUDE_MIN_M` / `MAX_M`), and blocked here for that reason: a value the engine will
 * ignore must not be storable, because in the database it would look like data.
 *
 * WIDE on purpose. Its job is to catch the unfilled field and the gross typo (145 for 1450), not to
 * arbitrate where coffee grows.
 */
export const COFFEE_ALTITUDE_MIN_M = 200;
export const COFFEE_ALTITUDE_MAX_M = 2800;

interface AltitudeFieldProps {
  /** Injected by antd's `Form.Item`. */
  value?: number | null;
  onChange?: (value: number | null) => void;
  latitude?: number | null;
  longitude?: number | null;
  disabled?: boolean;
}

export const AltitudeField: React.FC<AltitudeFieldProps> = ({
  value,
  onChange,
  latitude,
  longitude,
  disabled
}) => {
  const { t } = useI18n();
  const [derived, setDerived] = useState<number | null>(null);
  const [deriving, setDeriving] = useState(false);
  const [autofilled, setAutofilled] = useState(false);

  // The value lives in the form, not here. Read by reference so the query does not fire again on
  // every digit the grower types: what fires it is the coordinate.
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      setDerived(null);
      setAutofilled(false);
      return;
    }
    let cancelled = false;
    setDeriving(true);
    elevationFor(latitude, longitude)
      .then((metres) => {
        if (cancelled) return;
        setDerived(metres);
        // Only the gap is filled. A value the grower typed is never overwritten.
        if (metres !== null && (valueRef.current === null || valueRef.current === undefined)) {
          onChangeRef.current?.(metres);
          setAutofilled(true);
        }
      })
      .finally(() => {
        if (!cancelled) setDeriving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  const mismatch = elevationMismatch(value, derived);
  const hasCoords = latitude !== null && latitude !== undefined
    && longitude !== null && longitude !== undefined;

  return (
    <div className="altitude-field">
      <InputNumber
        value={value ?? null}
        onChange={(v) => {
          setAutofilled(false);
          onChange?.(typeof v === 'number' ? v : null);
        }}
        placeholder={t('farm.altitude.placeholder')}
        size="large"
        className="form-input"
        step={1}
        precision={0}
        style={{ width: '100%' }}
        controls={false}
        disabled={disabled}
      />
      {/* SIN `min`/`max` en el control, a propósito. `InputNumber` los aplica RECORTANDO al
          perder el foco: quien tecleaba 145 —el error de tecleo clásico por 1450— veía cómo se
          convertía solo en 200, y guardaba un número que nunca escribió y que nadie iba a poder
          distinguir de una medición. La ventana se comprueba en la regla del formulario, que
          RECHAZA y lo explica en vez de reescribir en silencio. */}

      {deriving && (
        <p className="altitude-field__hint">{t('farm.altitude.deriving')}</p>
      )}

      {!deriving && autofilled && derived !== null && (
        <p className="altitude-field__hint altitude-field__hint--ok">
          {t('farm.altitude.derived', { metres: derived })}
        </p>
      )}

      {!deriving && mismatch !== null && (
        <p className="altitude-field__hint altitude-field__hint--warn">
          {t('farm.altitude.mismatch', { metres: derived as number, diff: mismatch })}
        </p>
      )}

      {!deriving && !hasCoords && (
        <p className="altitude-field__hint">{t('farm.altitude.noCoords')}</p>
      )}

      {/* La nota de «es opcional» vive AQUÍ y no en el `help` del `Form.Item`: antd usa esa
          misma ranura para el mensaje de validación, así que un `help` fijo dejaba muda a la
          regla — se rechazaba el valor y sólo se veía «es opcional», que no explica nada. */}
      <p className="altitude-field__hint">{t('farm.altitude.optional')}</p>
    </div>
  );
};
