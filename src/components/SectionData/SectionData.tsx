import React, { useMemo, useState } from 'react';
import { Dropdown } from 'antd';
import { ClipboardList, MoreVertical, Pencil, Trash2, UserRound } from 'lucide-react';
import { useSectionData } from '../../hooks/useSectionData';
import { RecommendationList } from './RecommendationList';
import { AgronomicLog } from './AgronomicLog';
import { SensorPanel } from './SensorPanel';
import { SectionVerdictCard } from './SectionVerdictCard';
import { NoHubState, NeverReportedState, SilentSensorState } from './SectionStates';
import { SectionDetailSkeleton } from '../ui/Skeletons';
import { latestRecommendation, parsePayload } from './recommendationPayload';
import { buildVerdict } from './sectionVerdict';
import { Section } from '../../types/api.types';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { stageImage, stageLabelKey } from '../../utils/growthStage';
import { freshnessLevel, relativeLabel } from '../../utils/freshness';
import { STATUS_TOKENS } from '../../styles/statusTokens';
import './SectionData.scss';

interface SectionDataProps {
  authToken: string | null;
  section: Section;
  /** Opens the dialog where the hub is assigned or removed (the same as editing the section). */
  onAssignHub?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * A section's detail: the screen where the farmer decides. The order is "answer first": the verdict
 * on top (is there anything to attend to today?), then the cards that back it, and only then the
 * raw sensor evidence.
 *
 * The log stays next to the data and NOT at the end: with the sensor it is an INPUT to the
 * diagnosis, not an output.
 */
export const SectionData: React.FC<SectionDataProps> = ({
  authToken,
  section,
  onAssignHub,
  onEdit,
  onDelete,
}) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const isManager = user?.role?.id === 1 || /manager/i.test(user?.role?.name || '');

  const {
    loading,
    refreshing,
    error,
    hub,
    dataRecord,
    recommendations,
    nextRefreshAt,
    refresh,
    setToken,
  } = useSectionData(authToken, section.id);

  React.useEffect(() => {
    if (authToken) setToken(authToken);
  }, [authToken, setToken]);

  // The Manager can preview the farmer's view without ceasing to be one. The farmer does not see
  // this toggle: their screen is the simple one, not a trimmed version of another.
  const [asFarmer, setAsFarmer] = useState(false);
  const effManager = isManager && !asFarmer;

  const stageName = stageLabelKey(section.type)
    ? t(stageLabelKey(section.type) as string)
    : section.type;

  // Freshness is tied to the sensor DATUM, not the recommendation's date: with the engine's
  // deduplication, that date says "when the diagnosis changed", not "when the plot was checked".
  const lastReadingAt = dataRecord?.updatedAt ?? dataRecord?.timestamp ?? null;
  const level = freshnessLevel(lastReadingAt);
  const lastReadingLabel = relativeLabel(lastReadingAt, t);

  const latest = useMemo(() => latestRecommendation(recommendations), [recommendations]);
  const payload = useMemo(
    () => parsePayload(latest?.recommendationDescription),
    [latest]
  );
  const verdict = useMemo(
    () => buildVerdict(payload, t, Boolean(latest && !payload)),
    [payload, latest, t]
  );

  const silent = Boolean(hub) && Boolean(dataRecord) && level === 'silent';

  const chip = !hub
    ? { text: t('sections.coverage.noHub'), token: STATUS_TOKENS.neutral }
    : silent
      ? { text: t('sections.coverage.stale'), token: STATUS_TOKENS.warning }
      : dataRecord
        ? { text: t('sections.coverage.reporting'), token: STATUS_TOKENS.ok }
        : { text: t('sections.coverage.noHub'), token: STATUS_TOKENS.neutral };

  return (
    <div className="section-data">
      <header className="section-data__header">
        <img
          className="section-data__stage-img"
          src={stageImage(section.type, 'full') ?? '/assets/section_icons/vegetativo.png'}
          alt=""
          aria-hidden="true"
        />
        <div className="section-data__id">
          <h1 className="section-data__name">{section.name}</h1>
          <p className="section-data__stage">{stageName}</p>
        </div>
        <span
          className="section-data__chip"
          style={{
            color: chip.token.fg,
            background: chip.token.bg,
            borderColor: chip.token.border,
          }}
        >
          {chip.text}
        </span>

        {/* Editar y eliminar la sección viven aquí desde que la lista pasó a ser sólo triaje:
            allí eran dos iconos repetidos en cada tarjeta, con el borrado —la única acción sin
            vuelta atrás— a cuatro píxeles del lápiz en una pantalla que se recorre deprisa. */}
        {isManager && (onEdit || onDelete) && (
          <Dropdown
            menu={{
              items: [
                ...(onEdit
                  ? [{ key: 'edit', icon: <Pencil size={15} />, label: t('sections.edit'), onClick: onEdit }]
                  : []),
                ...(onEdit && onDelete ? [{ type: 'divider' as const }] : []),
                ...(onDelete
                  ? [{
                      key: 'delete',
                      icon: <Trash2 size={15} />,
                      label: t('sections.delete'),
                      danger: true,
                      onClick: onDelete,
                    }]
                  : []),
              ],
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <button
              type="button"
              className="section-data__menu"
              title={t('sections.actions')}
              aria-label={t('sections.actions')}
            >
              <MoreVertical size={18} />
            </button>
          </Dropdown>
        )}
      </header>

      {loading && <SectionDetailSkeleton />}

      {error && !loading && (
        <div className="section-data__error">
          {t('common.error')}: {String(error.message ?? error)}
        </div>
      )}

      {!loading && !error && (
        <>
          {!hub && (
            <div className="section-data__stack">
              <NoHubState isManager={isManager} onAssign={onAssignHub} />
              <AgronomicLog sectionId={section.id} />
            </div>
          )}

          {hub && !dataRecord && (
            <div className="section-data__stack">
              <NeverReportedState />
              <AgronomicLog sectionId={section.id} />
            </div>
          )}

          {/* Sensor callado: el diagnóstico anterior NO se muestra. Presentar el consejo de
              ayer sin avisar es peor que no dar ninguno. */}
          {hub && dataRecord && silent && (
            <div className="section-data__stack">
              <SilentSensorState
                sinceLabel={lastReadingLabel}
                lastReading={dataRecord}
                refreshing={refreshing}
                onRetry={refresh}
              />
              <AgronomicLog sectionId={section.id} />
            </div>
          )}

          {hub && dataRecord && !silent && (
            <div className="section-data__grid">
              <div className="section-data__main">
                <SectionVerdictCard
                  verdict={verdict}
                  lastReadingLabel={lastReadingLabel}
                  stageImage={stageImage(section.type, 'full')}
                  stageName={stageName}
                  showTechHint={effManager}
                />

                {isManager && verdict.state !== 'legacy' && (
                  <div className="section-data__density" role="group" aria-label={t('section.density.label')}>
                    <span className="section-data__density-label">{t('section.density.label')}</span>
                    <div className="section-data__density-seg">
                      <button
                        type="button"
                        className={asFarmer ? '' : 'is-on'}
                        aria-pressed={!asFarmer}
                        onClick={() => setAsFarmer(false)}
                      >
                        <ClipboardList size={14} /> {t('section.density.agronomist')}
                      </button>
                      <button
                        type="button"
                        className={asFarmer ? 'is-on' : ''}
                        aria-pressed={asFarmer}
                        onClick={() => setAsFarmer(true)}
                      >
                        <UserRound size={14} /> {t('section.density.farmer')}
                      </button>
                    </div>
                  </div>
                )}

                <RecommendationList
                  payload={payload}
                  legacyText={latest && !payload ? latest.recommendationDescription : undefined}
                  managerView={effManager}
                />
              </div>

              <aside className="section-data__aside">
                <SensorPanel
                  data={dataRecord}
                  stageName={section.type}
                  lastReadingLabel={lastReadingLabel}
                  nextRefreshAt={nextRefreshAt}
                  refreshing={refreshing}
                  onRefresh={refresh}
                />
                <AgronomicLog sectionId={section.id} />
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SectionData;
