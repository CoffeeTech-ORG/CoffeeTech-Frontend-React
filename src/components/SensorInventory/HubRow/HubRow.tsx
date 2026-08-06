import React, { useState } from 'react';
import { Check, ChevronRight, Copy, Hexagon } from 'lucide-react';
import { Sensor } from '../../../types/sensor.types';
import { useI18n } from '../../../contexts/I18nContext';
import { parseInstant, relativeLabel } from '../../../utils/freshness';
import { hubStateOf, hubStateTokens } from '../../../utils/hubState';
import './HubRow.scss';

interface HubRowProps {
  hub: Sensor;
  onOpen: (hub: Sensor) => void;
}

/**
 * A card in the Hubs inventory. Icon box on the left, MAC and status on the first line, plot on the
 * second, when it was last heard on the right. The MAC comes first and monospaced because this is
 * the DEVICE view: the subject is the equipment, not the plot. The section detail asks the reverse
 * -- what equipment measures this plot -- and there the section name leads.
 *
 * The state accent is on the left edge, as on the farm and section cards: one language for "this is
 * what is going on with this unit".
 */
export const HubRow: React.FC<HubRowProps> = ({ hub, onOpen }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const state = hubStateOf(hub);
  const tokens = hubStateTokens(state);
  const seenAt = parseInstant(hub.lastSeen);

  const copyMac = async (event: React.MouseEvent) => {
    // The whole card opens the detail; this button lives inside it. Without stopping propagation,
    // copying the MAC would open the panel.
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(hub.deviceHubId);
    } catch {
      // Browsers without the Clipboard API (or outside a secure context).
      const area = document.createElement('textarea');
      area.value = hub.deviceHubId;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="hub-row"
      role="button"
      tabIndex={0}
      style={{ borderLeftColor: tokens.fg }}
      onClick={() => onOpen(hub)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(hub);
        }
      }}
    >
      <span
        className="hub-row__icon"
        style={{ color: tokens.fg, background: tokens.bg }}
        aria-hidden="true"
      >
        <Hexagon size={19} />
      </span>

      <span className="hub-row__body">
        <span className="hub-row__ident">
          <span className="hub-row__mac">{hub.deviceHubId}</span>
          <button
            type="button"
            className={`hub-row__copy${copied ? ' is-copied' : ''}`}
            onClick={copyMac}
            title={t('sensors.card.copyCode')}
            aria-label={t('sensors.card.copyCode')}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <span
            className="hub-row__state"
            style={{ color: tokens.fg, background: tokens.bg, borderColor: tokens.border }}
          >
            {t(`hubs.state.${state}`)}
          </span>
          {/* El copiado sólo se confirmaba con el cambio de icono: un lector de pantalla no
              anunciaba nada. */}
          <span className="sr-only" role="status" aria-live="polite">
            {copied ? t('sensors.card.copied.announce') : ''}
          </span>
        </span>

        <span className="hub-row__place">
          {hub.sectionName ? (
            <>
              {hub.sectionName}
              {hub.farmName && <span className="hub-row__farm"> · {hub.farmName}</span>}
            </>
          ) : (
            <span className="hub-row__nowhere">{t('hubs.row.noSection')}</span>
          )}
        </span>
      </span>

      {/* La antigüedad relativa se lee sin calcular; la fecha exacta va debajo y entera en el
          `title`, que es donde acabó el `toLocaleString()` que antes ocupaba una columna propia. */}
      <span className="hub-row__seen" title={seenAt ? seenAt.toLocaleString() : undefined}>
        <span className="hub-row__ago" style={{ color: tokens.fg }}>
          {hub.lastSeen ? relativeLabel(hub.lastSeen, t) : t('sensors.time.never')}
        </span>
        {seenAt && <span className="hub-row__date">{seenAt.toLocaleDateString()}</span>}
      </span>

      <ChevronRight className="hub-row__chevron" size={18} aria-hidden="true" />
    </div>
  );
};
