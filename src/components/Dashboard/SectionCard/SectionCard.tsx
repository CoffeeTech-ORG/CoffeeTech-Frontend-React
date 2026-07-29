import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Section } from '../../../services/farms.service';
import { useI18n } from '../../../contexts/I18nContext';
import { STATUS_TOKENS, StatusTone } from '../../../styles/statusTokens';
import { stageImage, stageLabelKey } from '../../../utils/growthStage';
import { relativeLabel } from '../../../utils/freshness';
import './SectionCard.scss';

/** How many of each severity the hub's current diagnosis carries. */
export interface DiagnosisCounts {
  alert: number;
  warning: number;
  info: number;
}

/**
 * The section's data coverage, derived from the hub measuring it. Only a reporting hub carries
 * `counts`: with the sensor silent the diagnosis describes the plot yesterday, and this card must
 * not present it as today's state.
 */
export type SectionCoverage =
  | { kind: 'reporting'; lastSeen: string; counts?: DiagnosisCounts }
  | { kind: 'stale'; lastSeen: string }
  | { kind: 'no-hub' };

interface SectionCardProps {
  section: Section;
  /**
   * This plot's data state. Provided by the view, which queries the hubs and the diagnosis ONCE and
   * joins them by `sectionId` -- not a request per card.
   */
  coverage?: SectionCoverage;
  onViewDetails?: (sectionId: string) => void;
}

/**
 * A section, in a triage card. No edit or delete: the whole card is a target -- tap to open -- and
 * those actions live in the section detail, where the user is already looking at that plot.
 * Repeated per card, plus three farm icons in the header, they would make five icon buttons on a
 * screen whose job is to say which plot to look at.
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  coverage,
  onViewDetails,
}) => {
  const { t } = useI18n();

  // Image and name come from the shared mapping: the stage looks the same here, in the modals and
  // in the section detail.
  const stageImg = stageImage(section.type);
  const stageLabel = stageLabelKey(section.type);
  const stageName = stageLabel ? t(stageLabel) : section.type;

  // Axis 2 (device state): equipment left to install is not a crop urgency, so no terracotta
  // here.
  const deviceTone: StatusTone =
    coverage?.kind === 'reporting'
      ? 'ok'
      : coverage?.kind === 'stale'
        ? 'warning'
        : 'neutral';
  const tone = coverage ? STATUS_TOKENS[deviceTone] : null;

  const chipText =
    coverage?.kind === 'reporting'
      ? t('sections.coverage.reporting')
      : coverage?.kind === 'stale'
        ? t('sections.coverage.stale')
        : t('sections.coverage.noHub');

  // Axis 1 (severity): only the verdict uses this ramp, and only with fresh data.
  const counts = coverage?.kind === 'reporting' ? coverage.counts : undefined;
  const pending = counts ? counts.alert + counts.warning : 0;
  const verdictTone = counts && counts.alert > 0 ? 'alert' : 'warning';

  const line = [
    stageName,
    coverage && coverage.kind !== 'no-hub' ? relativeLabel(coverage.lastSeen, t) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={`section-card is-${coverage?.kind ?? 'unknown'}`}
      style={tone ? { borderLeftColor: tone.fg } : undefined}
      role="button"
      tabIndex={0}
      onClick={() => onViewDetails?.(section.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetails?.(section.id);
        }
      }}
    >
      <div className="section-card__row">
        <span className="section-card__stage-img" aria-hidden="true">
          {stageImg && <img src={stageImg} alt="" />}
        </span>

        <div className="section-card__id">
          <h3 className="section-card__name">{section.name}</h3>
          {/* Antes esta línea decía "Last updated" con `section.updatedAt` — cuándo alguien
              EDITÓ la sección. Se leía como la última lectura y podía diferir en más de un año. */}
          <p className="section-card__line">{line}</p>
        </div>

        {coverage && (
          <span
            className="section-card__chip"
            style={{ color: tone!.fg, background: tone!.bg, borderColor: tone!.border }}
          >
            {chipText}
          </span>
        )}

        <ChevronRight size={18} className="section-card__go" aria-hidden="true" />
      </div>

      {/* El veredicto del motor, que es lo que convierte la lista en un tablero de triaje:
          sin él la tarjeta sólo repite datos que ya eran ciertos el día que se creó. */}
      {counts && (
        <div
          className="section-card__verdict"
          style={{ color: pending > 0 ? STATUS_TOKENS[verdictTone].fg : STATUS_TOKENS.ok.fg }}
        >
          {pending > 0 ? (
            <>
              {pending === 1
                ? t('section.verdict.eyebrow.one')
                : t('section.verdict.eyebrow.many', { count: pending })}
              <ArrowRight size={14} aria-hidden="true" />
            </>
          ) : (
            t('sections.card.allGood')
          )}
        </div>
      )}
    </div>
  );
};
