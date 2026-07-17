import React from 'react';
import './Skeleton.scss';

interface SkeletonProps {
  /**
   * `line` for text, `block` for surfaces (thumbnails, chips) and `card` for a whole card with its
   * border and padding.
   */
  variant?: 'line' | 'block' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A loading silhouette.
 *
 * A spinning ring says "wait" but not WHAT is coming, so when the data arrives the page jumps and has
 * to be reread. Worse was what this app did: several states started at `loading: false`, so the first
 * frame painted an answer -- "This plot is not measured yet" -- that had not been asked of anyone. A
 * false verdict for 300 ms is costlier than a gap: the user has already read something untrue.
 *
 * The silhouette mimics the final shape, so when the data arrives nothing moves.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'line',
  width,
  height,
  className,
  children,
}) => (
  <div
    className={`skeleton skeleton--${variant}${className ? ` ${className}` : ''}`}
    style={{ width, height }}
    aria-hidden="true"
  >
    {children}
  </div>
);

/**
 * Container with the live-status role: it tells a screen reader that loading is under way, something
 * the silhouettes alone do not convey (they carry `aria-hidden`).
 */
export const SkeletonGroup: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div role="status" aria-live="polite" aria-busy="true" aria-label={label}>
    {children}
  </div>
);

export default Skeleton;
