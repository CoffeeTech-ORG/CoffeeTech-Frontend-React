import React, { useEffect, useState } from 'react';
import { AgronomicEvent, AgronomicEventType } from '../../types/api.types';
import { X, Trash2 } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { EVENT_ICON, formatDate, formatShort, addDays, daysSince } from './agronomicLog.utils';

interface Props {
  events: AgronomicEvent[];
  isManager: boolean;
  onClose: () => void;
  onDelete: (id: number) => Promise<void>;
}

/**
 * The log history. Timeline on top (to UNDERSTAND the cycle), chronological list below with its own
 * scroll (to ACT: review and correct). Vertical at every size: real events cluster into a few weeks,
 * a horizontal line would crowd the labels, and the vertical one behaves the same with 1 event or
 * 20.
 */
export const AgronomicHistoryModal: React.FC<Props> = ({ events, isManager, onClose, onDelete }) => {
  const { t, language } = useI18n();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Cycle milestones: the last of each type that opens a window (flowering and harvest end).
  const cycleTypes: AgronomicEventType[] = ['flowering', 'harvest_end'];
  const milestones = cycleTypes
    .map((tipo) => events.find((e) => e.eventType === tipo))
    .filter((e): e is AgronomicEvent => Boolean(e))
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  // Same windows as `statusFor`, and for the same reason they return a key, not an assembled
  // sentence.
  const windowFor = (ev: AgronomicEvent): { key: string; vars: Record<string, string>; tone: string } | null => {
    const d = new Date(ev.eventDate);
    if (ev.eventType === 'flowering') {
      return {
        key: 'log.status.flowering.since',
        vars: { date: formatShort(addDays(d, 120), language) },
        tone: 'alert',
      };
    }
    if (ev.eventType === 'harvest_end') {
      return {
        key: 'log.status.harvest.window',
        vars: { from: formatShort(addDays(d, 14), language), to: formatShort(addDays(d, 21), language) },
        tone: 'warn',
      };
    }
    return null;
  };

  return (
    <div className="agro-modal" role="dialog" aria-modal="true" aria-label={t('log.history.title')}>
      <div className="agro-modal__backdrop" onClick={onClose} />
      <div className="agro-modal__panel">
        <div className="agro-modal__head">
          <div>
            <h4>{t('log.history.title')}</h4>
            {/* El singular tiene clave propia: «1 registros» justo bajo un título se lee como
                descuido y hace dudar del resto. Mismo criterio que `sensors.time.day`. */}
            <p>
              {events.length === 1
                ? t('log.history.count.one')
                : t('log.history.count', { count: events.length })}
            </p>
          </div>
          <button type="button" className="agro-modal__close" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        {milestones.length > 0 && (
          <>
            <div className="agro-modal__caption">{t('log.history.cycle')}</div>
            <div className="agro-modal__cycle">
              <div className="agro-modal__always">{t('log.history.always')}</div>
              <div className="agro-modal__timeline">
                {milestones.map((ev) => {
                  const win = windowFor(ev);
                  return (
                    <div className="agro-modal__milestone" key={`ms-${ev.id}`}>
                      <span className={`agro-modal__dot is-${ev.eventType}`} />
                      <div className="agro-modal__ms-label">{t(`log.type.${ev.eventType}.label`)}</div>
                      <div className="agro-modal__ms-date">{formatDate(ev.eventDate, language)}</div>
                      {win && (
                        <div className={`agro-modal__ms-win tone-${win.tone}`}>{t(win.key, win.vars)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="agro-modal__caption">{t('log.history.all')}</div>
        <ul className="agro-modal__list">
          {events.map((ev) => {
            const label = t(`log.type.${ev.eventType}.label`);
            const confirming = confirmingId === ev.id;
            return (
              <li key={ev.id} className={confirming ? 'is-confirming' : ''}>
                <span className="agro-modal__icon">{EVENT_ICON[ev.eventType]}</span>
                <span className="agro-modal__label">{label}</span>
                <span className="agro-modal__date">{formatDate(ev.eventDate, language)}</span>
                <span className="agro-modal__ago">{t('log.history.ago', { days: daysSince(ev.eventDate) })}</span>
                {ev.notes && !confirming && <span className="agro-modal__note">{ev.notes}</span>}
                {isManager && (confirming ? (
                  <span className="agro-modal__confirm">
                    {t('log.history.delete.ask')}
                    <button type="button" className="agro-modal__yes"
                      onClick={async () => { await onDelete(ev.id); setConfirmingId(null); }}>
                      {t('log.history.delete.yes')}
                    </button>
                    <button type="button" className="agro-modal__no" onClick={() => setConfirmingId(null)}>
                      {t('common.cancel')}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="agro-modal__del"
                    title={t('log.history.delete.hint')}
                    aria-label={t('log.history.delete.label', {
                      type: label,
                      date: formatDate(ev.eventDate, language),
                    })}
                    onClick={() => setConfirmingId(ev.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                ))}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AgronomicHistoryModal;
