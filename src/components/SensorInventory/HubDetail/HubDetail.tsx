import React, { useEffect, useState } from 'react';
import { App as AntdApp, Select } from 'antd';
import { Check, Copy, Hexagon, X } from 'lucide-react';
import { Sensor } from '../../../types/sensor.types';
import { useI18n } from '../../../contexts/I18nContext';
import { parseInstant, relativeLabel } from '../../../utils/freshness';
import { hubStateOf, hubStateTokens } from '../../../utils/hubState';
import { HubPlacement } from '../../../hooks/useHubDetail';
import './HubDetail.scss';

interface HubDetailProps {
  hub: Sensor;
  history: HubPlacement[];
  freeSections: Array<{ id: number; name: string }>;
  cadenceMs: number | null;
  onClose: () => void;
  onAssign: (sectionId: number) => Promise<void>;
  onRemove: () => Promise<void>;
}

/**
 * A hub's detail: what it is, whether it is sending, which plot it serves and where it has been.
 *
 * A panel sliding OVER the list (a bottom sheet on the phone), not a full screen: checking a hub is
 * a short stop within reviewing the inventory, so the list stays behind it. This answers "where do
 * I put this device". The symmetric question -- "what equipment measures this plot" -- is answered
 * from the edit-section modal, and both call the same service.
 */
export const HubDetail: React.FC<HubDetailProps> = ({
  hub,
  history,
  freeSections,
  cadenceMs,
  onClose,
  onAssign,
  onRemove,
}) => {
  const { t, language } = useI18n();
  const { message } = AntdApp.useApp();
  const [copied, setCopied] = useState(false);
  /** Section chosen in the selector. `null` = none yet. */
  const [pending, setPending] = useState<number | null>(null);
  /** Is the reassign selector open? An unassigned hub has it open always. */
  const [moving, setMoving] = useState(false);
  const [busy, setBusy] = useState(false);

  // Close on Escape and lock background scroll: it is a layer on top, and without this the list
  // moves behind the panel on the wheel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const state = hubStateOf(hub);
  const tokens = hubStateTokens(state);
  const seenAt = parseInstant(hub.lastSeen);

  const fechaCorta = (iso: string | null | undefined) => {
    const d = parseInstant(iso);
    return d
      ? d.toLocaleDateString(language === 'en' ? 'en-GB' : 'es-PE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—';
  };

  const copyMac = async () => {
    try {
      await navigator.clipboard.writeText(hub.deviceHubId);
    } catch {
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

  const run = async (accion: () => Promise<void>, exito: string, fallo: string) => {
    setBusy(true);
    try {
      await accion();
      // The action consumes the choice and closes the selector. Otherwise it keeps showing a
      // section no longer free -- this hub just took it -- with the button still live to repeat an
      // assignment already made.
      setPending(null);
      setMoving(false);
      message.success(exito);
    } catch {
      message.error(fallo);
    } finally {
      setBusy(false);
    }
  };

  const picker = (placeholder: string, label: string, onRun: () => Promise<void>) => (
    <div className="hub-detail__actions">
      <Select
        className="hub-detail__picker"
        placeholder={placeholder}
        value={pending ?? undefined}
        onChange={setPending}
        disabled={busy || freeSections.length === 0}
        options={freeSections.map((s) => ({ value: s.id, label: s.name }))}
        notFoundContent={t('hubs.detail.noFreeSections')}
      />
      <button
        type="button"
        className="hub-detail__btn"
        disabled={busy || pending == null}
        onClick={onRun}
      >
        {label}
      </button>
    </div>
  );

  return (
    // The veil closes on click; the panel stops the click so it does not close itself.
    <div className="hub-detail" role="presentation" onClick={onClose}>
      <div
        className="hub-detail__panel"
        role="dialog"
        aria-modal="true"
        aria-label={hub.deviceHubId}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Asa de arrastre: sólo se ve en el teléfono, donde el panel es una hoja que sube desde
            abajo y hay que decir que se puede cerrar tirando de ella. */}
        <span className="hub-detail__grip" aria-hidden="true" />

        {/* Título de la hoja: convierte el panel en una cosa con nombre en vez de una MAC
            flotando. La ✕ va con él, no colgada de la identidad. */}
        <header className="hub-detail__head">
          <h2 className="hub-detail__title">{t('hubs.detail.title')}</h2>
          <button
            type="button"
            className="hub-detail__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={19} />
          </button>
        </header>

        <div className="hub-detail__body">
          {/* Identidad en UNA fila: icono, MAC con su parcela debajo, y el estado a la derecha.
              Antes la MAC era un titular de 18 px con la pastilla en su propia línea, y la
              parcela ni aparecía —había que bajar hasta «Asignación actual» para saber de qué
              hub se trataba. */}
          <div className="hub-detail__ident">
            <span
              className="hub-detail__icon"
              style={{ color: tokens.fg, background: tokens.bg }}
              aria-hidden="true"
            >
              <Hexagon size={19} />
            </span>

            <span className="hub-detail__ident-text">
              <span className="hub-detail__mac-row">
                <span className="hub-detail__mac">{hub.deviceHubId}</span>
                <button
                  type="button"
                  className={`hub-detail__copy${copied ? ' is-copied' : ''}`}
                  onClick={copyMac}
                  aria-label={t('sensors.card.copyCode')}
                  title={t('sensors.card.copyCode')}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
                <span className="sr-only" role="status" aria-live="polite">
                  {copied ? t('sensors.card.copied.announce') : ''}
                </span>
              </span>
              <span className="hub-detail__where">
                {hub.sectionName ? (
                  <>
                    {hub.sectionName}
                    {hub.farmName && ` · ${hub.farmName}`}
                  </>
                ) : (
                  t('hubs.row.noSection')
                )}
              </span>
            </span>

            <span
              className="hub-detail__state"
              style={{ color: tokens.fg, background: tokens.bg }}
            >
              {t(`hubs.state.${state}`)}
            </span>
          </div>

          {/* Dos tarjetas PLANAS, sin borde. Con borde eran iguales que las de «Asignación
              actual» y las del historial: tres niveles del mismo tratamiento seguidos hacen que
              todo parezca una pila de fichas. */}
          <section className="hub-detail__facts">
            <div className="hub-detail__fact">
              <span className="hub-detail__fact-label">{t('hubs.detail.lastReading')}</span>
              <span
                className="hub-detail__fact-value"
                title={seenAt ? seenAt.toLocaleString() : undefined}
              >
                {hub.lastSeen ? relativeLabel(hub.lastSeen, t) : t('sensors.time.never')}
              </span>
            </div>

            {/* La cadencia sale de medir la última semana. Si no se pudo medir —hub sin asignar, o
                sin lecturas en la ventana— esta tarjeta NO se dibuja: decir «cada 2 minutos» por
                defecto sería afirmar algo que nadie ha comprobado. */}
            {cadenceMs !== null && (
              <div className="hub-detail__fact">
                <span className="hub-detail__fact-label">{t('hubs.detail.cadence')}</span>
                <span className="hub-detail__fact-value">
                  {t('hubs.detail.cadenceValue', {
                    minutes: Math.max(1, Math.round(cadenceMs / 60000)),
                  })}
                </span>
              </div>
            )}
          </section>

          <section className="hub-detail__block">
            <h3 className="hub-detail__block-title">{t('hubs.detail.assignment')}</h3>

            {hub.sectionId != null ? (
              <div className="hub-detail__placement">
                <div className="hub-detail__placement-head">
                  <div>
                    <p className="hub-detail__placement-section">{hub.sectionName}</p>
                    {hub.farmName && <p className="hub-detail__placement-farm">{hub.farmName}</p>}
                  </div>
                  <span className="hub-detail__installed">{t('hubs.detail.installed')}</span>
                </div>

                {hub.installedAt && (
                  <p className="hub-detail__placement-since">
                    {t('hubs.detail.since', { date: fechaCorta(hub.installedAt) })} ·{' '}
                    {relativeLabel(hub.installedAt, t)}
                  </p>
                )}

                <div className="hub-detail__pair">
                  <button
                    type="button"
                    className="hub-detail__btn is-quiet"
                    disabled={busy}
                    onClick={() => {
                      setMoving((v) => !v);
                      setPending(null);
                    }}
                    aria-expanded={moving}
                  >
                    {t('hubs.detail.reassign')}
                  </button>
                  {/* Retirar no destruye nada: cierra el periodo y las lecturas siguen contando
                      para su parcela. Va en terracota porque es la acción que deja una sección sin
                      diagnóstico, no porque borre. */}
                  <button
                    type="button"
                    className="hub-detail__btn is-danger"
                    disabled={busy}
                    onClick={() => run(onRemove, t('hubs.detail.removed'), t('hubs.detail.failed'))}
                  >
                    {t('hubs.detail.remove')}
                  </button>
                </div>

                {moving &&
                  picker(t('hubs.detail.reassignTo'), t('hubs.detail.confirmMove'), () =>
                    run(
                      () => onAssign(pending!),
                      t('hubs.detail.reassigned'),
                      t('hubs.detail.failed'),
                    ),
                  )}
              </div>
            ) : (
              <>
                {/* Caja crema con borde discontinuo, no un bloque ámbar: el aparato funciona, lo
                    que falta es dónde ponerlo. El ámbar de aviso lo reserva el eje 2 para «sin
                    señal», que sí es un problema del equipo. */}
                <div className="hub-detail__unassigned">
                  <p className="hub-detail__unassigned-title">{t('hubs.state.unassigned')}</p>
                  <p className="hub-detail__unassigned-body">{t('hubs.detail.unassignedWhy')}</p>
                </div>

                {picker(t('hubs.detail.assignTo'), t('hubs.detail.assign'), () =>
                  run(() => onAssign(pending!), t('hubs.detail.assigned'), t('hubs.detail.failed')),
                )}

                {freeSections.length === 0 && (
                  <p className="hub-detail__note">{t('hubs.detail.noFreeSections')}</p>
                )}
              </>
            )}
          </section>

          <section className="hub-detail__block">
            <h3 className="hub-detail__block-title">{t('hubs.detail.history')}</h3>

            {history.length === 0 ? (
              <p className="hub-detail__note">{t('hubs.detail.historyEmpty')}</p>
            ) : (
              // Timeline: a rail and a dot per period. A plain list does not show the periods
              // are consecutive, which is what the history is about.
              <ol className="hub-detail__timeline">
                {history.map((p) => {
                  const dot = hubStateTokens(p.open ? 'reporting' : 'unassigned');
                  return (
                    <li key={p.id} className="hub-detail__period">
                      <span
                        className="hub-detail__dot"
                        style={{ borderColor: dot.fg }}
                        aria-hidden="true"
                      />
                      <div className="hub-detail__period-card">
                        <div className="hub-detail__period-head">
                          <span className="hub-detail__period-section">
                            {p.sectionName ?? t('hubs.detail.sectionGone')}
                          </span>
                          <span
                            className={`hub-detail__period-tag${p.open ? ' is-open' : ''}`}
                          >
                            {t(p.open ? 'hubs.detail.periodOpen' : 'hubs.detail.periodClosed')}
                          </span>
                        </div>
                        <p className="hub-detail__period-range">
                          {fechaCorta(p.installedAt)} →{' '}
                          {p.removedAt ? fechaCorta(p.removedAt) : t('hubs.detail.now')}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <p className="hub-detail__note">{t('hubs.detail.historyWhy')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};
