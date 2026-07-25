import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { Farm } from '../../hooks/useFarms';
import { FarmOverview } from '../../hooks/useFarmOverview';
import { useI18n } from '../../contexts/I18nContext';
import { relativeLabel } from '../../utils/freshness';
import { FarmWeatherChip } from './FarmWeatherChip';
import { FarmStateChip } from './FarmStateChip';
import './FarmRow.scss';

interface FarmRowProps {
  farm: Farm;
  overview?: FarmOverview;
  onOpen: (farmId: string) => void;
  /** Unlocated farms only: goes to edit, where the coordinate is set. */
  onLocate?: (farmId: string) => void;
  /** Highlights this farm on the map while the pointer or focus is on the row. */
  onHighlight?: (farmId: string | null) => void;
}

/**
 * A farm, in one row. On a triage screen what matters is taking in every farm at a glance; as
 * cards, nine farms force scrolling and the urgency order is lost.
 *
 * No edit or delete: those live on the farm screen. Here there is only what is read and the next
 * step, which keeps the one irreversible action out of a list scrolled quickly.
 */
export const FarmRow: React.FC<FarmRowProps> = ({
  farm,
  overview,
  onOpen,
  onLocate,
  onHighlight,
}) => {
  const { t } = useI18n();

  // `null` when the tier could not be computed. It must NOT default to 'ok': that paints the row
  // green with an "up to date" chip for a farm nobody has looked at.
  const tier = overview?.tier ?? null;
  const unlocated = farm.latitude == null || farm.longitude == null;

  // A farm can be measuring AND have plots still to install. That does not move it out of the
  // calm group (nothing is broken), but it has to be said, or the chip's "up to date" would claim
  // the whole farm is covered.
  const partial =
    overview && overview.reportingCount > 0 && overview.noHubCount > 0
      ? t('farm.state.partial', {
          r: overview.reportingCount,
          n: overview.sectionCount,
        })
      : null;

  /** What to know about this farm, in one line. */
  const detalle = [
    farm.location,
    farm.altitude ? `${Math.round(farm.altitude)} m` : null,
    // Same wording as the section list and the detail: three screens describing the same
    // instant must not tell it with different buckets.
    overview?.lastSeen
      ? `${t('farm.lastReading.label')} ${relativeLabel(overview.lastSeen, t)}`
      : null,
    partial,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={`farm-row is-${tier ?? 'unknown'}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(farm.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(farm.id);
        }
      }}
      // On focus as well as hover: navigating the list by keyboard moves the map the same as by
      // pointer.
      onMouseEnter={() => onHighlight?.(farm.id)}
      onMouseLeave={() => onHighlight?.(null)}
      onFocus={() => onHighlight?.(farm.id)}
      onBlur={() => onHighlight?.(null)}
    >
      <div className="farm-row__main">
        <div className="farm-row__head">
          {/* Punto del color del eje: repite el estado del grupo en la propia fila, para que
              una finca siga siendo legible si se mira aislada. */}
          <span className="farm-row__dot" aria-hidden="true" />
          <span className="farm-row__name">{farm.name}</span>
        </div>
        {/* `title` porque la línea se recorta con puntos suspensivos cuando no cabe, y lo
            último que se pierde es «Última lectura: hace 3 días» — justo lo que dice cuánto
            lleva callado el equipo. Con nombres de ubicación largos pasa a cualquier ancho. */}
        <p className="farm-row__detail" title={detalle}>
          {detalle}
        </p>
      </div>

      <div className="farm-row__aside">
        <FarmWeatherChip farm={farm} />

        {/* Un solo chip: el que explica por qué la finca está en este grupo. Varios chips por
            fila convertían el triaje en otra cosa que interpretar. */}
        {tier === 'setup' && unlocated ? (
          <button
            type="button"
            className="farm-row__locate"
            onClick={(e) => {
              e.stopPropagation();
              onLocate?.(farm.id);
            }}
          >
            {t('farm.location.fix')}
          </button>
        ) : tier ? (
          <FarmStateChip tier={tier} overview={overview} />
        ) : null}

        <ArrowRight size={16} className="farm-row__go" aria-hidden="true" />
      </div>

      {unlocated && tier !== 'setup' && (
        <span className="farm-row__badge" title={t('farm.location.unset')}>
          <MapPin size={12} aria-hidden="true" />
        </span>
      )}
    </div>
  );
};
