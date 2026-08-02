import React, { useEffect, useState } from 'react';
import { Dayjs } from 'dayjs';
import { useI18n } from '../../../contexts/I18nContext';
import { RegionalRainDay, regionalRainDaily } from '../../../services/regionalRain.service';
import './RegionalRainBand.scss';

interface RegionalRainBandProps {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  range: [Dayjs, Dayjs];
}

/**
 * How much it rained in the ZONE, in millimetres, per the regional model.
 *
 * `RainStrip` draws what the hub measured: it rained or it did not, graded by how many readings
 * detected it. This is another thing from another source -- a 9 km reanalysis cell -- and mixing them
 * in the same block would make the millimetres read as a plot measurement at first glance. So it
 * shares no axis, no colour, no card: the measurement in blue, the model in grey.
 *
 * The sensor cannot give millimetres: its rain is a binary. This is exactly the case the API was
 * agreed for -- data the sensor does NOT have -- but with the label saying what it is and what it is
 * worth.
 *
 * Provenance is not enough; the uncertainty has to be stated too. Over 2023-2025 at the pilot's
 * coordinates, ECMWF IFS gives 861 mm/year and ERA5 gives 2442, nearly triple for the same point. And
 * it is not contrasted with a rain gauge: PISCO and RAIN4PE would be the natural contrast for Peru and
 * are not implemented.
 */
export const RegionalRainBand: React.FC<RegionalRainBandProps> = ({
  latitude,
  longitude,
  altitude,
  range
}) => {
  const { t } = useI18n();
  const [dias, setDias] = useState<RegionalRainDay[] | null>(null);
  const [cargando, setCargando] = useState(false);

  const desde = range[0].format('YYYY-MM-DD');
  const hasta = range[1].format('YYYY-MM-DD');

  useEffect(() => {
    if (latitude === null || longitude === null) {
      setDias(null);
      return;
    }
    let cancelado = false;
    setCargando(true);
    regionalRainDaily(latitude, longitude, desde, hasta, altitude)
      .then((d) => {
        if (!cancelado) setDias(d);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [latitude, longitude, altitude, desde, hasta]);

  // No coordinate, no band, and it explains rather than leave a silent gap: the same rule the rest
  // of the app uses for an unlocated farm.
  if (latitude === null || longitude === null) {
    return (
      <section className="regional-rain">
        <p className="regional-rain__empty">{t('reports.regionalRain.noCoords')}</p>
      </section>
    );
  }

  if (cargando) {
    return (
      <section className="regional-rain">
        <p className="regional-rain__empty">{t('reports.regionalRain.loading')}</p>
      </section>
    );
  }

  if (!dias || dias.length === 0) {
    return (
      <section className="regional-rain">
        <p className="regional-rain__empty">{t('reports.regionalRain.unavailable')}</p>
      </section>
    );
  }

  const valores = dias.map((d) => d.mm ?? 0);
  const total = valores.reduce((a, b) => a + b, 0);
  // The tallest bar in the period sets the scale. A RELATIVE axis, and the label says so: with no
  // fixed maximum, two different periods cannot be compared by eye, and pretending they can would be
  // the same shape of error as comparing a mean against a band.
  const maximo = Math.max(...valores, 1);

  const fmtDia = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <section className="regional-rain">
      <header className="regional-rain__head">
        <span className="regional-rain__title">
          <i className="regional-rain__dot" aria-hidden="true" />
          {t('reports.regionalRain.title')}
        </span>
        <span className="regional-rain__meta">
          {t('reports.regionalRain.total', { mm: total.toFixed(0), max: maximo.toFixed(1) })}
        </span>
      </header>

      <div className="regional-rain__bars">
        {dias.map((d) => {
          const mm = d.mm ?? 0;
          const etiqueta = `${fmtDia(d.date)} · ${mm.toFixed(1)} mm`;
          return (
            <span key={d.date} className="regional-rain__col" title={etiqueta}>
              <span
                className="regional-rain__bar"
                style={{ height: `${Math.max(mm > 0 ? 2 : 0, (mm / maximo) * 100)}%` }}
              />
              <span className="sr-only">{etiqueta}</span>
            </span>
          );
        })}
      </div>

      <div className="regional-rain__axis">
        <span>{fmtDia(dias[0].date)}</span>
        {dias.length > 1 && <span>{fmtDia(dias[dias.length - 1].date)}</span>}
      </div>

      <p className="regional-rain__caveat">{t('reports.regionalRain.caveat')}</p>
    </section>
  );
};
