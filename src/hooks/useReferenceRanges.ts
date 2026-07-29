import { useEffect, useState } from 'react';
import {
  ReferenceRanges,
  normalizeGrowthStage,
  referenceService,
} from '../services/reference.service';

/**
 * The engine's reference bands for the section's stage.
 *
 * Cached by stage: they are the same for every section in the same phase and do not change while the
 * app is open, so re-requesting them on each entry into a plot makes no sense -- and the sensor panel
 * repaints every 2 minutes.
 *
 * If the model does not answer it returns `null` and the view shows the values WITHOUT a verdict. The
 * same rule as in Reports: a value with no reference is honest; one with the wrong reference is not.
 */
const cache = new Map<string, ReferenceRanges | null>();

export const useReferenceRanges = (stageName?: string | null) => {
  const stage = normalizeGrowthStage(stageName ?? undefined);
  const key = stage ?? '_';
  const [ranges, setRanges] = useState<ReferenceRanges | null>(cache.get(key) ?? null);

  useEffect(() => {
    if (cache.has(key)) {
      setRanges(cache.get(key) ?? null);
      return;
    }

    let cancelled = false;
    referenceService.getReferenceRanges(stage).then((data) => {
      cache.set(key, data);
      if (!cancelled) setRanges(data);
    });

    return () => {
      cancelled = true;
    };
  }, [key, stage]);

  return ranges;
};
