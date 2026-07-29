import React, { useState } from 'react';
import {
  Leaf, FlaskConical, Thermometer, Droplets, Bug, ShieldAlert,
  ClipboardList, Clock, ChevronDown, Info, PiggyBank,
  CheckCircle2, Search, UserRound, TreePine, Eye, Sprout,
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import {
  Actionability,
  RecItem,
  RecPayload,
  SEVERITY_ORDER,
  Severity,
  cap,
  diagnosisItems,
  reminderItems,
} from './recommendationPayload';
import './RecommendationList.scss';

interface RecommendationListProps {
  /** Diagnosis already interpreted by the view; null if the record is plain text. */
  payload: RecPayload | null;
  /** Text from the older format, shown as-is so it is not lost. */
  legacyText?: string;
  /** Effective view: with technical detail (Manager) or only the actionable (Farmer). */
  managerView: boolean;
}

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const p = { size: 18, strokeWidth: 1.8 } as const;
  switch (type) {
    case 'nutrition': return <Leaf {...p} />;
    case 'disease': return <ShieldAlert {...p} />;
    case 'pest': return <Bug {...p} />;
    case 'thermal': return <Thermometer {...p} />;
    case 'irrigation': return <Droplets {...p} />;
    case 'lab': return <FlaskConical {...p} />;
    case 'management': return <ClipboardList {...p} />;
    default: return <Info {...p} />;
  }
};

// Icon per actionability type (consistent with the chip colour in the SCSS).
const ACT_ICON: Record<Actionability, React.ReactNode> = {
  direct: <Sprout size={12} />,
  verify: <Search size={12} />,
  consult: <UserRound size={12} />,
  structural: <TreePine size={12} />,
  monitor: <Eye size={12} />,
  none: <CheckCircle2 size={12} />,
};

const RecCard: React.FC<{ item: RecItem; isManager: boolean; defaultOpen: boolean }> = ({
  item, isManager, defaultOpen,
}) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);

  const hasTech =
    isManager &&
    Boolean(
      item.agronomist_message ||
      item.verification ||
      (item.refer && item.referral_note) ||
      item.action?.disclaimer
    );

  // The dose is "firm" only when it can be applied directly ('direct'). If the datum is
  // provisional, or needs confirming in the field ('verify') or coordinating with the technician
  // ('consult'), the ACTION is marked contingent with a clear label.
  const actionContingent =
    Boolean(item.action?.product) &&
    (Boolean(item.provisional) || item.actionability === 'consult' || item.actionability === 'verify');
  const actionTag = item.provisional
    ? t('section.rec.tag.referential')
    : item.actionability === 'consult'
      ? t('section.rec.tag.coordinate')
      : t('section.rec.tag.confirm');

  const act = item.actionability;
  const actLabel = act
    ? item.actionability_label || t(`section.rec.actionability.${act}`)
    : null;

  return (
    <article
      className={`rec-card sev-${item.severity}${item.saving ? ' is-saving' : ''}${
        item.actionability === 'none' ? ' is-quiet' : ''
      }`}
    >
      <div className="rec-card__head">
        <span className="rec-card__icon"><TypeIcon type={item.type} /></span>
        <span className="rec-card__type">
          {cap(item.type_label)}{item.subject ? ` · ${item.subject}` : ''}
        </span>
        <span className="rec-card__pill">{item.severity_label}</span>
      </div>

      <div className="rec-card__chips">
        {act && actLabel && (
          <span className={`rec-chip act-${act}`}>{ACT_ICON[act]} {actLabel}</span>
        )}
        {item.saving && (
          <span className="rec-chip saving"><PiggyBank size={12} /> {t('section.rec.saving')}</span>
        )}
        {item.forecast && (
          <span className="rec-chip fore">
            <Clock size={12} /> {t('section.rec.forecast', { hours: item.forecast.horizon_h ?? '?' })}
          </span>
        )}
        {item.provisional && <span className="rec-chip">{t('section.rec.provisional')}</span>}
      </div>

      <p className="rec-card__msg">{item.farmer_message}</p>

      {isManager && item.action?.product && (
        <div className={`rec-action${actionContingent ? ' is-contingent' : ''}`}>
          <div className="rec-action__head">
            <span className="rec-action__lead">{t('section.rec.action')}</span>
            {actionContingent && <span className="rec-action__tag">{actionTag}</span>}
          </div>
          <dl className="rec-action__grid">
            <div><dt>{t('section.rec.product')}</dt><dd>{item.action.product}</dd></div>
            {item.action.dose && (
              <div><dt>{t('section.rec.dose')}</dt><dd>{item.action.dose}</dd></div>
            )}
            {item.action.method_label && (
              <div>
                <dt>{t('section.rec.method')}</dt>
                <dd>{t('section.rec.methodValue', { method: item.action.method_label })}</dd>
              </div>
            )}
            {item.action.timing && (
              <div><dt>{t('section.rec.timing')}</dt><dd>{item.action.timing}</dd></div>
            )}
          </dl>
        </div>
      )}

      {hasTech && (
        <div className={`rec-tech ${open ? 'open' : ''}`}>
          <button
            type="button"
            className="rec-tech__toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            <ChevronDown size={14} className="rec-tech__chev" />
            {open ? t('section.rec.tech.hide') : t('section.rec.tech.show')}
          </button>
          {open && (
            <div className="rec-tech__body">
              {item.agronomist_message && (
                <div className="rec-tech__row">
                  <span className="rec-tech__lab">{t('section.rec.tech.label')}</span>
                  <span>{item.agronomist_message}</span>
                </div>
              )}
              {item.verification && (
                <div className="rec-tech__row">
                  <span className="rec-tech__lab">{t('section.rec.verify')}</span>
                  <span>{item.verification}</span>
                </div>
              )}
              {item.refer && item.referral_note && (
                <div className="rec-tech__row">
                  <span className="rec-tech__lab">{t('section.rec.referral')}</span>
                  <span>{item.referral_note}</span>
                </div>
              )}
              {item.action?.disclaimer && (
                <div className="rec-tech__row">
                  <span className="rec-tech__lab">{t('section.rec.note')}</span>
                  <span>{item.action.disclaimer}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

/** Static reminders (lab analysis, liming): their own section, collapsed. */
const RemindersBlock: React.FC<{ reminders: RecItem[] }> = ({ reminders }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!reminders.length) return null;

  return (
    <div className={`rec-reminders ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="rec-reminders__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <ChevronDown size={14} className="rec-reminders__chev" />
        {t('section.rec.reminders', { count: reminders.length })}
      </button>
      {open && (
        <ul className="rec-reminders__list">
          {reminders.map((r, i) => (
            <li key={`${r.rule_id}-${i}`}>
              <FlaskConical size={14} />
              <span>{r.farmer_message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * The cards that back the verdict. The diagnosis arrives already interpreted from the view (one
 * read of the engine JSON for both the verdict and this list), so nothing is parsed again here.
 */
export const RecommendationList: React.FC<RecommendationListProps> = ({
  payload,
  legacyText,
  managerView,
}) => {
  const { t } = useI18n();
  const [sevFilter, setSevFilter] = useState<Severity | null>(null);

  if (!payload) {
    if (!legacyText) return null;
    return (
      <div className="recommendation-list">
        <h4>{t('recommendations.title')}</h4>
        <div className="rec-legacy">{legacyText}</div>
      </div>
    );
  }

  if (!payload.items.length) return null;

  const recs = diagnosisItems(payload);
  const reminders = reminderItems(payload);
  const infoItems = recs.filter((i) => i.severity === 'info');
  // The Manager sees everything; the farmer only the actionable ("all fine" is summed up at the
  // foot).
  const roleCards = managerView ? recs : recs.filter((i) => i.severity !== 'info');
  const cards = sevFilter ? roleCards.filter((i) => i.severity === sevFilter) : roleCards;

  const sevNoun = (sev: Severity, n: number): string =>
    n === 1 ? t(`section.rec.sev.${sev}`) : t(`section.rec.sev.${sev}.plural`);

  return (
    <div className="recommendation-list">
      <div className="rec-topbar">
        <h4>{t('recommendations.title')}</h4>
        <div className="rec-counts">
          {SEVERITY_ORDER.map((sev) => {
            const n = recs.filter((i) => i.severity === sev).length;
            if (!n) return null;
            const active = sevFilter === sev;
            const dim = sevFilter !== null && !active;
            return (
              <button
                key={sev}
                type="button"
                className={`rec-count sev-${sev}${active ? ' is-active' : ''}${dim ? ' is-dim' : ''}`}
                aria-pressed={active}
                title={
                  active
                    ? t('section.rec.clearFilter')
                    : t('section.rec.filterBy', { noun: sevNoun(sev, n) })
                }
                onClick={() => setSevFilter((prev) => (prev === sev ? null : sev))}
              >
                <i />{n} {sevNoun(sev, n)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rec-cards">
        {cards.map((item, idx) => (
          <RecCard
            key={`${item.rule_id}-${idx}`}
            item={item}
            isManager={managerView}
            defaultOpen={managerView && item.severity !== 'info'}
          />
        ))}
        {cards.length === 0 && (
          <div className="rec-emptyfilter">
            {t('section.rec.filterEmpty')}
            <button type="button" onClick={() => setSevFilter(null)}>
              {t('section.rec.clearFilter')}
            </button>
          </div>
        )}
      </div>

      {!managerView && infoItems.length > 0 && !sevFilter && (
        <div className="rec-allgood">
          <CheckCircle2 size={15} />{' '}
          {t('section.rec.allGood', {
            subjects: infoItems.map((i) => cap(i.subject || i.type_label)).join(', '),
          })}
        </div>
      )}

      <RemindersBlock reminders={reminders} />
    </div>
  );
};
