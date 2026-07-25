import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, MapPinOff } from 'lucide-react';
import { MapView, MapMarker, MarkerTone } from '../MapView/MapView';
import { Farm } from '../../hooks/useFarms';
import { FarmOverview } from '../../hooks/useFarmOverview';
import { useI18n } from '../../contexts/I18nContext';
import { FarmWeatherChip } from './FarmWeatherChip';
import { FarmStateChip } from './FarmStateChip';
import './FarmsMap.scss';

interface FarmsMapProps {
  farms: Farm[];
  overview: Record<string, FarmOverview>;
  /** Farm hovered in the list: its pin enlarges. */
  highlightedId?: string | null;
}

/** Below this width the map collapses. Same breakpoint the panel stacks at. */
const NARROW = '(max-width: 1200px)';

const useIsNarrow = () => {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return narrow;
};

/**
 * Where the farms are and how each one is doing, at a glance. The list answers "what", the map
 * answers "where", which decides the order to visit them in.
 *
 * The pin uses the same colour as that farm's row, so jumping from map to list needs no
 * reinterpretation: terracotta the crop, amber the equipment, grey what is still to install.
 *
 * On the phone it starts collapsed: the work there is triage, and the map cost ~300 px of scroll
 * per visit for a secondary question. Collapsed, not gone: whoever has farms in different valleys
 * opens it, and it is still the only place where "does not appear until located" means anything.
 */
export const FarmsMap: React.FC<FarmsMapProps> = ({ farms, overview, highlightedId }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const narrow = useIsNarrow();
  const [openOnNarrow, setOpenOnNarrow] = useState(false);

  // `!= null` covers `null` and `undefined`; an older backend omits the field entirely.
  const ubicadas = farms.filter((f) => f.latitude != null && f.longitude != null);
  const sinUbicar = farms.length - ubicadas.length;

  const markers: MapMarker[] = ubicadas.map((f) => {
    // The explicit type is not decoration: without `noUncheckedIndexedAccess`, TypeScript
    // assumes a keyed access always hits and treats the fallback as dead code -- the case that
    // really happens while the state has not arrived.
    const ov: FarmOverview | undefined = overview[f.id];
    // No state, neutral pin: green would say the farm is up to date before anyone looked, and on
    // a map that reads even faster than in the list.
    const tier: MarkerTone = ov?.tier ?? 'unknown';
    return {
      id: f.id,
      latitude: f.latitude as number,
      longitude: f.longitude as number,
      tone: tier,
      label: f.name,
      boundary: f.boundary,
      popup: (
        <div className="farm-pin">
          <p className="farm-pin__name">{f.name}</p>
          <p className="farm-pin__meta">
            <MapPin size={13} aria-hidden="true" />
            <span>{f.location}</span>
            <FarmWeatherChip farm={f} />
          </p>
          {/* Hay chip si hay estado. Sin él, la ficha se queda con nombre, ubicación y clima:
              lo que se sabe de la finca, sin un veredicto que nadie ha calculado. */}
          {ov && <FarmStateChip tier={ov.tier} overview={ov} />}
          <button
            type="button"
            className="farm-pin__go"
            onClick={() => navigate(`/fincas/${f.id}`)}
          >
            {t('farmsMap.openSections')}
          </button>
        </div>
      ),
    };
  });

  // With no located farm there is nothing to draw. It says why, instead of an empty rectangle
  // that looks like a load failure.
  if (markers.length === 0) {
    return (
      <div className="farms-map farms-map--empty">
        <MapPinOff size={20} aria-hidden="true" />
        <p>{t('farmsMap.empty')}</p>
      </div>
    );
  }

  const desplegado = !narrow || openOnNarrow;

  const cabecera = (
    <>
      <h2 className="farms-map__title">{t('farmsMap.title')}</h2>
      {sinUbicar > 0 && (
        // Honest about what the map does NOT show: without this, four pins would read as four
        // farms.
        <span className="farms-map__missing">{t('farmsMap.missing', { n: sinUbicar })}</span>
      )}
    </>
  );

  return (
    <section className={`farms-map${desplegado ? '' : ' is-collapsed'}`}>
      {narrow ? (
        <button
          type="button"
          className="farms-map__head farms-map__toggle"
          onClick={() => setOpenOnNarrow((v) => !v)}
          aria-expanded={openOnNarrow}
        >
          {cabecera}
          <ChevronDown size={18} className="farms-map__chevron" aria-hidden="true" />
        </button>
      ) : (
        <div className="farms-map__head">{cabecera}</div>
      )}

      {desplegado && (
        <>
          {/* Alto en `%` en escritorio: el mapa acompaña a la lista en la columna fija, así que
              lo que sobra de la altura de la ventana es suyo. En móvil, una altura contenida. */}
          <MapView
            markers={markers}
            highlightedId={highlightedId}
            initialLayer="street"
            height={narrow ? 260 : '100%'}
          />
          <p className="farms-map__hint">{t('farmsMap.hint')}</p>
        </>
      )}
    </section>
  );
};
