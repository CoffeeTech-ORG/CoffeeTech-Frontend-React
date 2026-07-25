import React from 'react';
import { FarmOverview, FarmTier } from '../../hooks/useFarmOverview';
import { useI18n } from '../../contexts/I18nContext';
import './FarmStateChip.scss';

interface FarmStateChipProps {
  tier: FarmTier;
  overview?: FarmOverview;
}

/**
 * Why this farm is in the group it is in, as a label. Shared because two places render it -- the
 * list row and the card opened by tapping a pin -- and they are the same statement about the same
 * farm; duplicated, they would drift apart at the first fix and map and list would disagree.
 *
 * The unlocated case is NOT here: the list handles it with the "Locate" button, and on the map it
 * cannot occur, since a farm with no coordinate has no pin.
 */
export const FarmStateChip: React.FC<FarmStateChipProps> = ({ tier, overview }) => {
  const { t } = useI18n();

  if (tier === 'ok') {
    return <span className="farm-state-chip is-ok">{t('farm.tier.ok')}</span>;
  }

  if (!overview) return null;

  if (tier === 'crop') {
    return (
      <span className="farm-state-chip is-crop">
        {t('farm.state.cropAlert', { n: overview.cropAlertCount })}
      </span>
    );
  }

  if (tier === 'device') {
    return (
      <span className="farm-state-chip is-device">
        {t('farm.state.silent', { n: overview.silentCount })}
      </span>
    );
  }

  return (
    <span className="farm-state-chip is-setup">
      {/* Una finca ubicada y todavía sin secciones también cae en `setup`, y ahí `noHubCount`
          vale 0: sin este caso el chip diría «0 sin sensor». Es el orden natural al dar de alta
          una finca —ubicarla antes de dividirla—, así que es lo primero que vería alguien que
          acaba de crear la suya. */}
      {overview.sectionCount === 0
        ? t('farm.state.noSections')
        : t('farm.state.noHub', { n: overview.noHubCount })}
    </span>
  );
};
