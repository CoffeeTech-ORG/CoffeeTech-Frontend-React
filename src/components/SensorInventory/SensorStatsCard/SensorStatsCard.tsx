import React from 'react';
import { SensorStats } from '../../../types/sensor.types';
import { useI18n } from '../../../contexts/I18nContext';
import { HubState, hubStateTokens } from '../../../utils/hubState';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import './SensorStatsCard.scss';

interface SensorStatsCardProps {
  stats: SensorStats;
  /** Active states. Empty = unfiltered. */
  selected: HubState[];
  onSelect: (states: HubState[]) => void;
}

/**
 * The inventory summary that also IS the filter. Count and filter are one object: if you see "1
 * sin señal", clicking it leaves you that one -- rather than counts and filter as separate
 * controls saying the same thing.
 *
 * The counts come from the state DERIVED from the last reading, not the stored `status` (see
 * `utils/hubState`), so a hub dead for months does not keep adding to "active".
 *
 * Two shapes by width, as in the prototype: accented cards on desktop, where there is room for the
 * large figure and its explanation; a pill row on the phone, where four cards would fill the screen
 * before the first hub.
 */
export const SensorStatsCard: React.FC<SensorStatsCardProps> = ({ stats, selected, onSelect }) => {
  const { t } = useI18n();
  const isMobile = useIsMobile();

  /**
   * "No signal" covers two states: the one that went silent and the one that never reported. They
   * are told apart on the hub card, where there is room, but as a filter they are one question:
   * which are not sending. Hubs register on their own when they report, so `never` is rare (only a
   * manual registration) and does not earn its own cell.
   */
  const cards: Array<{ key: string; states: HubState[]; count: number; tone: HubState }> = [
    { key: 'reporting', states: ['reporting'], count: stats.reporting, tone: 'reporting' },
    { key: 'silent', states: ['silent', 'never'], count: stats.silent + stats.never, tone: 'silent' },
    { key: 'unassigned', states: ['unassigned'], count: stats.unassigned, tone: 'unassigned' },
  ];

  const sameSet = (a: HubState[], b: HubState[]) =>
    a.length === b.length && a.every((s) => b.includes(s));

  if (isMobile) {
    return (
      <div className="hub-stats hub-stats--chips">
        {cards.map(({ key, states, count, tone }) => {
          const on = sameSet(selected, states);
          const tokens = hubStateTokens(tone);
          return (
            <button
              key={key}
              type="button"
              className={`hub-stats__chip${on ? ' is-on' : ''}`}
              aria-pressed={on}
              onClick={() => onSelect(on ? [] : states)}
              style={{
                color: tokens.fg,
                background: tokens.bg,
                borderColor: on ? tokens.fg : 'transparent',
              }}
            >
              {count} {t(`hubs.stats.${key}.short`)}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="hub-stats">
      {/* El total no filtra: quita el filtro. Sin esto, salir de un filtro exige recordar cuál se
          pulsó, y con la tarjeta activa fuera de la vista al desplazarse no siempre se sabe. */}
      <button
        type="button"
        className={`hub-stats__card${selected.length === 0 ? ' is-on' : ''}`}
        aria-pressed={selected.length === 0}
        onClick={() => onSelect([])}
      >
        <span className="hub-stats__label">{t('hubs.stats.total')}</span>
        <span className="hub-stats__value">{stats.total}</span>
      </button>

      {cards.map(({ key, states, count, tone }) => {
        const on = sameSet(selected, states);
        const tokens = hubStateTokens(tone);
        return (
          <button
            key={key}
            type="button"
            className={`hub-stats__card${on ? ' is-on' : ''}`}
            aria-pressed={on}
            onClick={() => onSelect(on ? [] : states)}
            // The border accent and the dot come from axis 2 (device state). Never terracotta: a
            // silent device is a technical fact, not a crop request.
            style={{ borderLeftColor: tokens.fg }}
          >
            <span className="hub-stats__label">
              <span className="hub-stats__dot" style={{ background: tokens.fg }} aria-hidden="true" />
              {t(`hubs.stats.${key}`)}
            </span>
            <span className="hub-stats__value" style={{ color: tokens.fg }}>
              {count}
            </span>
            <span className="hub-stats__hint">{t(`hubs.stats.${key}.hint`)}</span>
          </button>
        );
      })}
    </div>
  );
};
