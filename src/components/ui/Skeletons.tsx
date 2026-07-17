import React from 'react';
import { Skeleton, SkeletonGroup } from './Skeleton';
import { useI18n } from '../../contexts/I18nContext';

/**
 * Silhouettes of the components that take a while to arrive.
 *
 * Each mimics its component's final shape -- same sizes, same border, same gap -- so the layout does
 * not jump when the data lands. They live beside the primitive, not inside each view: if the card
 * changes shape, its silhouette is fixed in the same place.
 */

/** Section cards for a farm's list. */
export const SectionCardsSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => {
  const { t } = useI18n();

  return (
    <SkeletonGroup label={t('common.loading')}>
      <div className="skeleton-stack">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton skeleton--card skeleton-section-card">
            <div className="skeleton-section-card__row">
              <Skeleton variant="block" className="skeleton-section-card__thumb" />
              <div className="skeleton-section-card__id">
                <Skeleton variant="line" width="52%" height={15} />
                <Skeleton variant="line" width="34%" />
              </div>
              <Skeleton variant="block" className="skeleton-section-card__chip" />
            </div>
            <Skeleton variant="line" className="skeleton-section-card__foot" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
};

/** Rows for the farm panel. */
export const FarmRowsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const { t } = useI18n();

  return (
    <SkeletonGroup label={t('common.loading')}>
      <div className="skeleton-stack">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-farm-row">
            <div className="skeleton-farm-row__main">
              <Skeleton variant="line" width="30%" height={15} />
              <Skeleton variant="line" width="62%" />
            </div>
            <Skeleton variant="block" className="skeleton-farm-row__chip" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
};

/**
 * Section detail: the verdict on top and the sensor panel alongside.
 *
 * The one that matters most. Without it the first frame painted "This plot is not measured yet" -- an
 * answer not yet asked -- and only then did the real diagnosis arrive.
 */
export const SectionDetailSkeleton: React.FC = () => {
  const { t } = useI18n();

  return (
    <SkeletonGroup label={t('common.loading')}>
      <div className="skeleton-detail">
        <div className="skeleton-detail__main">
          <Skeleton variant="block" height={168} />
          <Skeleton variant="block" height={132} />
        </div>
        <div className="skeleton-detail__aside">
          <Skeleton variant="block" height={214} />
          <Skeleton variant="block" height={132} />
        </div>
      </div>
    </SkeletonGroup>
  );
};
