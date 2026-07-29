import React, { useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { STATUS_TOKENS } from '../../styles/statusTokens';
import { SectionVerdict, subjectLabel } from './sectionVerdict';
import './SectionVerdictCard.scss';

interface SectionVerdictCardProps {
  verdict: SectionVerdict;
  /** "40 min ago": the freshness of the datum backing the verdict. */
  lastReadingLabel?: string | null;
  /** The stage illustration, for the calm state. */
  stageImage?: string | null;
  stageName?: string;
  /** The Manager can open the technical detail; the farmer is not told about it. */
  showTechHint?: boolean;
}

/**
 * The answer, right at the top. "Answer first": one conclusion in serif and, if there is something
 * to apply, the step-by-step INLINE -- not in a modal -- because whoever follows it is in the field
 * with the phone in one hand.
 *
 * With nothing to attend to the screen does not go empty or fake a task: it says all is well and
 * shows what is next on the calendar, the useful information that day.
 */
export const SectionVerdictCard: React.FC<SectionVerdictCardProps> = ({
  verdict,
  lastReadingLabel,
  stageImage,
  stageName,
  showTechHint = false,
}) => {
  const { t } = useI18n();
  const [openSteps, setOpenSteps] = useState(false);

  if (verdict.state === 'legacy') return null;

  if (verdict.state === 'allgood') {
    return (
      <section className="verdict verdict--allgood">
        <div className="verdict__check" aria-hidden="true">
          <CheckCircle2 size={46} strokeWidth={1.6} />
        </div>
        <h2 className="verdict__headline">{verdict.headline}</h2>
        {lastReadingLabel && (
          <p className="verdict__seen">
            {t('section.verdict.allGood.seen', { when: lastReadingLabel })}
          </p>
        )}

        {(stageName || verdict.next) && (
          <div className="verdict__aside">
            {stageName && (
              <div className="verdict__stage">
                {stageImage && <img src={stageImage} alt="" aria-hidden="true" />}
                <div>
                  <div className="verdict__stage-name">
                    {t('section.verdict.stage', { stage: stageName })}
                  </div>
                </div>
              </div>
            )}
            {verdict.next && (
              <div className="verdict__next">
                <span className="verdict__overline">{t('section.verdict.next')}</span>
                <span className="verdict__next-name">{subjectLabel(verdict.next)}</span>
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  if (verdict.state === 'empty') {
    return (
      <section className="verdict verdict--empty">
        <p className="verdict__body">{verdict.headline}</p>
      </section>
    );
  }

  const tone = STATUS_TOKENS[verdict.tone];

  return (
    <section className="verdict verdict--attention" style={{ borderLeftColor: tone.fg }}>
      <div className="verdict__overline" style={{ color: tone.fg }}>
        <span className="verdict__dot" style={{ background: tone.fg }} aria-hidden="true" />
        {verdict.count === 1
          ? t('section.verdict.eyebrow.one')
          : t('section.verdict.eyebrow.many', { count: verdict.count })}
      </div>

      <h2 className="verdict__headline">{verdict.headline}</h2>
      {verdict.body && <p className="verdict__body">{verdict.body}</p>}

      {/* Sin producto ni dosis no hay CTA: la accionabilidad del ítem (verificar, consultar,
          medida de fondo) ya se explica en su tarjeta, y un botón "Ver cómo hacerlo" que no
          lleva a ningún paso es exactamente la promesa vacía que se quiere evitar. */}
      {verdict.steps.length > 0 && (
        <>
          <button
            type="button"
            className="verdict__cta"
            onClick={() => setOpenSteps((o) => !o)}
            aria-expanded={openSteps}
          >
            {openSteps ? t('section.verdict.hideSteps') : t('section.verdict.showSteps')}
            <ChevronDown size={16} className={openSteps ? 'is-open' : undefined} />
          </button>

          {openSteps && (
            <div className="verdict__steps">
              <span className="verdict__overline">{t('section.verdict.stepByStep')}</span>

              {/* El motor puede dar producto y dosis y aun así NO autorizar a aplicarlos hoy
                  (hay que confirmar la plaga, o coordinar con el técnico). Sin este aviso el
                  paso a paso se leería como una orden y sería un consejo que no toca dar. */}
              {verdict.contingency && (
                <p className="verdict__contingency">
                  <strong>{t(`section.rec.tag.${verdict.contingency}`)}.</strong>
                  {verdict.verification ? ` ${verdict.verification}` : ''}
                </p>
              )}

              <ol>
                {verdict.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {showTechHint && (
                <p className="verdict__hint">{t('section.verdict.techHint')}</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default SectionVerdictCard;
