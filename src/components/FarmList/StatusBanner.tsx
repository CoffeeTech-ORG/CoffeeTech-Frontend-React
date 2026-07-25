import React from 'react';
import { AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { FarmOverview, FarmTier } from '../../hooks/useFarmOverview';
import { useI18n } from '../../contexts/I18nContext';
import './StatusBanner.scss';

interface StatusBannerProps {
  overview: Record<string, FarmOverview>;
  total: number;
}

/**
 * One-line summary: what the farms need today, before the list. The banner announces the heaviest
 * problem that actually exists: terracotta only if the crop asks for something, amber if a device
 * is silent, green when there is nothing -- a legitimate, frequent answer, not a gap.
 *
 * Always-terracotta "N farms need attention" would fold install work into that N and, with one hub
 * installed, shout "8 farms need attention" in red for pending installs: the axis error the cards
 * already fixed.
 */
export const StatusBanner: React.FC<StatusBannerProps> = ({ overview, total }) => {
  const { t } = useI18n();

  const cuenta = (tier: FarmTier) =>
    Object.values(overview).filter((o) => o.tier === tier).length;

  const crop = cuenta('crop');
  const device = cuenta('device');
  const setup = cuenta('setup');
  const ok = cuenta('ok');

  const tono: FarmTier = crop > 0 ? 'crop' : device > 0 ? 'device' : setup > 0 ? 'setup' : 'ok';

  // The banner is a full sentence, so agreement matters: "1 fincas" jars. The compact chips
  // ("3 sin sensor") do not need it.
  const frase = (clave: string, n: number) =>
    n === 1 ? t(`${clave}.one`) : t(clave, { n });

  const titulo =
    tono === 'crop'
      ? frase('banner.crop', crop)
      : tono === 'device'
        ? frase('banner.device', device)
        : tono === 'setup'
          ? frase('banner.setup', setup)
          : frase('banner.ok', total);

  const icono =
    tono === 'crop' ? (
      <AlertTriangle size={20} aria-hidden="true" />
    ) : tono === 'device' ? (
      <AlertTriangle size={20} aria-hidden="true" />
    ) : tono === 'setup' ? (
      <Wrench size={20} aria-hidden="true" />
    ) : (
      <CheckCircle2 size={20} aria-hidden="true" />
    );

  // The detail mentions only what exists: listing zeros ("0 tranquilas") is noise.
  const partes = [
    ok > 0 ? t('banner.detail.ok', { n: ok }) : null,
    tono !== 'device' && device > 0 ? t('banner.detail.device', { n: device }) : null,
    tono !== 'setup' && setup > 0 ? t('banner.detail.setup', { n: setup }) : null,
  ].filter(Boolean);

  return (
    <div className={`status-banner is-${tono}`} role="status">
      <span className="status-banner__icon" aria-hidden="true">
        {icono}
      </span>
      <div className="status-banner__text">
        <p className="status-banner__title">{titulo}</p>
        {partes.length > 0 && (
          <p className="status-banner__detail">{partes.join(' · ')}</p>
        )}
      </div>
    </div>
  );
};
