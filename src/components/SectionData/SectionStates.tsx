import React from 'react';
import { RadioTower, RefreshCw, WifiOff } from 'lucide-react';
import { DataRecord } from '../../types/api.types';
import { useI18n } from '../../contexts/I18nContext';
import { parseInstant } from '../../utils/freshness';
import './SectionStates.scss';

/**
 * The states in which the section has NO diagnosis to give. All three are grey or amber, never
 * terracotta: they are equipment or install problems (axis 2 of `statusTokens.ts`), not crop ones.
 * None fakes a check or recycles the last diagnosis: advice based on yesterday's data presented as
 * today's is the fastest way to lose trust.
 */

interface NoHubStateProps {
  isManager: boolean;
  /** Goes to the section list, where hub assignment lives. */
  onAssign?: () => void;
}

export const NoHubState: React.FC<NoHubStateProps> = ({ isManager, onAssign }) => {
  const { t } = useI18n();

  return (
    <section className="sec-state sec-state--nohub">
      <div className="sec-state__icon" aria-hidden="true">
        <RadioTower size={30} strokeWidth={1.6} />
      </div>
      <h2 className="sec-state__headline">{t('section.state.noHub.title')}</h2>
      <p className="sec-state__body">{t('section.state.noHub.body')}</p>
      {isManager ? (
        <button type="button" className="sec-state__cta" onClick={onAssign}>
          {t('section.state.noHub.assign')}
        </button>
      ) : (
        <p className="sec-state__hint">{t('section.state.noHub.askManager')}</p>
      )}
    </section>
  );
};

interface SilentSensorStateProps {
  /** "hace 14 h" */
  sinceLabel: string;
  lastReading?: DataRecord | null;
  refreshing?: boolean;
  onRetry?: () => void;
}

export const SilentSensorState: React.FC<SilentSensorStateProps> = ({
  sinceLabel,
  lastReading,
  refreshing = false,
  onRetry,
}) => {
  const { t } = useI18n();

  // `parseInstant` and not `new Date`: if this field ever arrives zoneless -- as `devices.lastSeen`
  // does -- the time would come out five hours off with no warning.
  const stamp = parseInstant(lastReading?.updatedAt || lastReading?.timestamp);
  const when = stamp
    ? stamp.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const vitals = [
    lastReading?.celciusGradeTemperature != null
      ? `${lastReading.celciusGradeTemperature.toFixed(1)} °C`
      : null,
    lastReading?.airHumidityPercent != null
      ? `${t('cardData.airHumidity')} ${lastReading.airHumidityPercent.toFixed(0)} %`
      : null,
  ].filter(Boolean);

  return (
    <>
      <section className="sec-state sec-state--silent">
        <div className="sec-state__overline">
          <WifiOff size={14} />
          {t('section.state.silent.eyebrow')}
        </div>
        <h2 className="sec-state__headline">
          {t('section.state.silent.title', { since: sinceLabel })}
        </h2>
        <p className="sec-state__body">{t('section.state.silent.body')}</p>
        {onRetry && (
          <button
            type="button"
            className="sec-state__cta sec-state__cta--soft"
            onClick={onRetry}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'is-spinning' : undefined} />
            {t('common.refresh')}
          </button>
        )}
      </section>

      {when && (
        <p className="sec-state__footnote">
          {t('section.state.silent.lastKnown', {
            when,
            vitals: vitals.length ? ` · ${vitals.join(' · ')}` : '',
          })}
        </p>
      )}
    </>
  );
};

/** An assigned hub that never sent a reading. Not silent: it has not spoken yet. */
export const NeverReportedState: React.FC = () => {
  const { t } = useI18n();

  return (
    <section className="sec-state sec-state--nohub">
      <div className="sec-state__icon" aria-hidden="true">
        <RadioTower size={30} strokeWidth={1.6} />
      </div>
      <h2 className="sec-state__headline">{t('section.state.neverReported.title')}</h2>
      <p className="sec-state__body">{t('section.state.neverReported.body')}</p>
    </section>
  );
};
