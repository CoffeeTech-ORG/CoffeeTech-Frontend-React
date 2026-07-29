import React, { useMemo, useState } from 'react';
import { useAgronomicEvents } from '../../hooks/useAgronomicEvents';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { AgronomicEvent, AgronomicEventType } from '../../types/api.types';
import { Plus, X } from 'lucide-react';
import { AgronomicHistoryModal } from './AgronomicHistoryModal';
import { EVENT_ICON, EVENT_ORDER, formatDate, statusFor, todayISO } from './agronomicLog.utils';
import './AgronomicLog.scss';

interface AgronomicLogProps {
  sectionId: string | number;
}

/**
 * The crop log. The card shows the CURRENT STATE (one fixed row per event type, with its last date
 * and the derived consequence), not the chronological list, so the height is constant with 4
 * entries or 400 and answers the frequent question -- "what am I missing to record?" -- at a glance.
 * The full history lives in a separate modal.
 */
export const AgronomicLog: React.FC<AgronomicLogProps> = ({ sectionId }) => {
  const { events, loading, error, addEvent, removeEvent } = useAgronomicEvents(sectionId);
  const { user } = useAuth();
  const { t, language } = useI18n();
  const isManager = user?.role?.id === 1 || /manager/i.test(user?.role?.name || '');

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AgronomicEventType>('flowering');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Quick entry (from the "unrecorded" chips): asks only for the date.
  const [quickType, setQuickType] = useState<AgronomicEventType | null>(null);
  const [quickDate, setQuickDate] = useState(todayISO());
  const [quickNotes, setQuickNotes] = useState('');
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);

  // The engine always uses each type's MOST RECENT event; the view reflects the same.
  const lastByType = useMemo(() => {
    const map = new Map<AgronomicEventType, AgronomicEvent>();
    for (const ev of events) {
      const prev = map.get(ev.eventType);
      if (!prev || new Date(ev.eventDate) > new Date(prev.eventDate)) map.set(ev.eventType, ev);
    }
    return map;
  }, [events]);

  const registered = EVENT_ORDER.filter((t) => lastByType.has(t));
  const missing = EVENT_ORDER.filter((t) => !lastByType.has(t));

  // Quick entry from a chip: the user ALREADY chose the type by tapping it, so only the date is
  // asked. The full form would hand back the question they just answered.
  const startQuick = (tipo: AgronomicEventType) => {
    setOpen(false);
    setQuickType(tipo);
    setQuickDate(todayISO());
    setQuickNotes('');
    setQuickNoteOpen(false);
  };

  const submitQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickType) return;
    setSaving(true);
    try {
      await addEvent(quickType, quickDate, quickNotes);
      setQuickType(null);
    } catch {
      // el error ya queda en `error`
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addEvent(type, date, notes);
      setNotes('');
      setDate(todayISO());
      setOpen(false);
    } catch {
      // el error ya queda en `error`
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="agro-log">
      <div className="agro-log__head">
        <div className="agro-log__intro">
          <h4>{t('log.title')}</h4>
          <p className="agro-log__sub">{t('log.lede')}</p>
        </div>
        <button type="button" className="agro-log__add" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={14} /> : <Plus size={14} />}{' '}
          {open ? t('common.cancel') : t('log.record')}
        </button>
      </div>

      {open && (
        <form className="agro-log__form" onSubmit={submit}>
          <div className="agro-log__types">
            {EVENT_ORDER.map((tipo) => (
              <button
                key={tipo}
                type="button"
                className={`agro-log__type${type === tipo ? ' is-on' : ''}`}
                onClick={() => setType(tipo)}
              >
                {EVENT_ICON[tipo]} {t(`log.type.${tipo}.label`)}
              </button>
            ))}
          </div>
          <p className="agro-log__hint">{t(`log.type.${type}.hint`)}</p>
          <div className="agro-log__row">
            <label>
              {t('log.when')}
              <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className="agro-log__notes">
              {t('log.note')}
              <input
                type="text"
                value={notes}
                maxLength={255}
                placeholder={t(`log.type.${type}.placeholder`)}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <button type="submit" className="agro-log__save" disabled={saving}>
              {saving ? t('log.saving') : t('common.save')}
            </button>
          </div>
        </form>
      )}

      {error && <div className="agro-log__error">{String(error)}</div>}

      {loading && !events.length ? (
        <div className="agro-log__empty">{t('log.loading')}</div>
      ) : !events.length ? (
        <div className="agro-log__onboard">
          <p>{t('log.onboard.body')}</p>
          <div className="agro-log__onboard-steps">
            <span>
              <i className="dot is-flowering" /> {t('log.type.flowering.label')}{' '}
              <em>{t('log.onboard.flowering')}</em>
            </span>
            <span>
              <i className="dot is-harvest" /> {t('log.type.harvest_end.label')}{' '}
              <em>{t('log.onboard.harvest')}</em>
            </span>
          </div>
          <button type="button" className="agro-log__save" onClick={() => setOpen(true)}>
            {t('log.onboard.action')}
          </button>
        </div>
      ) : (
        <>
          {/* Registrados primero: intercalar los vacíos entre ellos rompía el ritmo visual y
              hacía que las filas grises compitieran con los datos reales. */}
          <ul className="agro-log__status">
            {registered.map((tipo) => {
              const last = lastByType.get(tipo)!;
              const st = statusFor(tipo, last.eventDate, language);
              return (
                <li key={tipo}>
                  <span className="agro-log__icon">{EVENT_ICON[tipo]}</span>
                  <span className="agro-log__label">{t(`log.type.${tipo}.label`)}</span>
                  <span className="agro-log__date">{formatDate(last.eventDate, language)}</span>
                  <span className={`agro-log__tag tone-${st.tone}`}>{t(st.key, st.vars)}</span>
                </li>
              );
            })}
          </ul>

          {/* Los pendientes van agrupados aparte: dejan de ser "filas rotas" y pasan a ser una
              llamada a la acción clara. */}
          {missing.length > 0 && (
            <div className="agro-log__pending">
              <span className="agro-log__pending-title">{t('log.pending')}</span>
              <div className="agro-log__pending-chips">
                {missing.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    className={`agro-log__chip${quickType === tipo ? ' is-on' : ''}`}
                    onClick={() => (quickType === tipo ? setQuickType(null) : startQuick(tipo))}
                  >
                    <Plus size={12} /> {t(`log.type.${tipo}.label`)}
                  </button>
                ))}
              </div>

              {quickType && (
                <form className="agro-log__quick" onSubmit={submitQuick}>
                  <label className="agro-log__quick-date">
                    {t(`log.type.${quickType}.question`)}
                    <input
                      type="date"
                      value={quickDate}
                      max={todayISO()}
                      autoFocus
                      onChange={(e) => setQuickDate(e.target.value)}
                      required
                    />
                  </label>
                  <div className="agro-log__quick-actions">
                    <button type="submit" className="agro-log__save" disabled={saving}>
                      {saving ? t('log.saving') : t('common.save')}
                    </button>
                    <button type="button" className="agro-log__quick-cancel" onClick={() => setQuickType(null)}>
                      {t('common.cancel')}
                    </button>
                  </div>
                  {quickNoteOpen ? (
                    <input
                      className="agro-log__quick-note"
                      type="text"
                      value={quickNotes}
                      maxLength={255}
                      placeholder={t(`log.type.${quickType}.placeholder`)}
                      onChange={(e) => setQuickNotes(e.target.value)}
                    />
                  ) : (
                    <button type="button" className="agro-log__quick-addnote" onClick={() => setQuickNoteOpen(true)}>
                      + {t('log.addNote')}
                    </button>
                  )}
                </form>
              )}
            </div>
          )}

          <button type="button" className="agro-log__more" onClick={() => setHistoryOpen(true)}>
            {t('log.seeAll', { count: events.length })}
          </button>
        </>
      )}

      {historyOpen && (
        <AgronomicHistoryModal
          events={events}
          isManager={isManager}
          onClose={() => setHistoryOpen(false)}
          onDelete={removeEvent}
        />
      )}
    </div>
  );
};

export default AgronomicLog;
