import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { Hexagon, RefreshCw } from 'lucide-react';
import { useSensors } from '../../hooks/useSensors';
import { HubState } from '../../utils/hubState';
import { HubRow } from './HubRow/HubRow';
import { SensorStatsCard } from './SensorStatsCard/SensorStatsCard';
import { Skeleton } from '../ui/Skeleton';
import { useI18n } from '../../contexts/I18nContext';
import './SensorInventory.scss';

/**
 * What the list offers the detail panel drawn over it. `refresh` is `useSensors`' `refetch`, called
 * by the panel on assign or remove; without it the card behind would still say the hub is in the
 * section it just left.
 */
export interface HubsOutletContext {
  refresh: () => Promise<void> | void;
}

export const useHubsOutlet = () => useOutletContext<HubsOutletContext>();

/**
 * The Hubs inventory. A hub is the per-section ESP32 that averages what its Nodes send; the
 * instruments live in the Nodes and are not inventoried, so there are only hubs here.
 *
 * READ-ONLY as to registration: hubs appear on their own when they first report. The only decision
 * made here is which plot each serves, and that lives in its detail -- mounted in the trailing
 * `Outlet`, OVER this list without unmounting it.
 */
export const SensorInventory: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { sensors, loading, error, refetch, getSensorStats, filterSensors } = useSensors();

  /** Active filter states. Empty = all. Set by the summary cards. */
  const [states, setStates] = useState<HubState[]>([]);

  const visible = useMemo(() => filterSensors({ states }), [filterSensors, states]);
  const stats = useMemo(() => getSensorStats(), [getSensorStats]);
  const outlet = useMemo<HubsOutletContext>(() => ({ refresh: refetch }), [refetch]);

  const header = (
    <header className="hubs__intro">
      <p className="hubs__eyebrow">{t('hubs.eyebrow')}</p>
      <h1 className="hubs__title">{t('hubs.title')}</h1>
      <p className="hubs__lede">{t('hubs.lede')}</p>
    </header>
  );

  // Skeleton in the shape of what is coming -- four cards and a stack of rows -- rather than a
  // spinner that says neither how long nor what is loading.
  if (loading) {
    return (
      <div className="hubs">
        {header}
        <div className="hubs__loading">
          <Skeleton variant="block" height={84} />
          <Skeleton variant="block" height={56} />
          <Skeleton variant="block" height={56} />
          <Skeleton variant="block" height={56} />
        </div>
        {/* El `Outlet` va también aquí: al entrar por un enlace directo a `/hubs/:id`, el panel
            trae sus propios datos y no tiene por qué esperar a la lista. */}
        <Outlet context={outlet} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="hubs">
        {header}
        <div className="hubs__error" role="alert">
          <p className="hubs__error-title">{t('sensors.error.loading')}</p>
          <p className="hubs__error-body">{error}</p>
          <button type="button" className="hubs__retry" onClick={refetch}>
            {t('sensors.tryAgain')}
          </button>
        </div>
        <Outlet context={outlet} />
      </div>
    );
  }

  return (
    <div className="hubs">
      <div className="hubs__head">
        {header}
        <button type="button" className="hubs__refresh" onClick={refetch}>
          <RefreshCw size={15} />
          {t('common.refresh')}
        </button>
      </div>

      {/* Aviso en verde y no párrafo suelto: es la explicación de por qué esta pantalla no tiene
          un botón de «añadir», y en gris tenue nadie la leía. */}
      <p className="hubs__hint">
        <Hexagon size={15} aria-hidden="true" />
        {t('hubs.readOnly')}
      </p>

      {/* El resumen ES el filtro: pulsar «1 sin señal» deja ese uno. Antes había un panel
          plegable aparte que repetía estos mismos estados como botones y como `<select>`. */}
      <SensorStatsCard stats={stats} selected={states} onSelect={setStates} />

      <div className="hubs__divider">
        <span className="hubs__divider-label">{t('hubs.allHubs')}</span>
        <span className="hubs__divider-rule" aria-hidden="true" />
      </div>

      {visible.length === 0 ? (
        <div className="hubs__empty">
          <Hexagon size={30} aria-hidden="true" />
          <p className="hubs__empty-title">{t('hubs.empty.title')}</p>
          <p className="hubs__empty-body">
            {sensors.length === 0 ? t('hubs.empty.none') : t('hubs.empty.filtered')}
          </p>
          {sensors.length > 0 && (
            <button type="button" className="hubs__retry" onClick={() => setStates([])}>
              {t('hubs.empty.clear')}
            </button>
          )}
        </div>
      ) : (
        <div className="hubs__list">
          {visible.map((hub) => (
            <HubRow key={hub.id} hub={hub} onOpen={(h) => navigate(`/hubs/${h.id}`)} />
          ))}
        </div>
      )}

      {/* El detalle, encima de todo esto. Esta lista no se desmonta al abrirlo. */}
      <Outlet context={outlet} />
    </div>
  );
};
