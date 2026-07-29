import { useCallback, useEffect, useState } from 'react';
import { sensorService } from '../services/sensor.service';
import { SectionCoverage } from '../components/Dashboard/SectionCard/SectionCard';
import { fetchLatestDiagnoses } from '../services/diagnosis.service';
import { STALE_AFTER_HOURS, hoursSince } from '../utils/freshness';

/**
 * Each list section's state: whether it is measuring and, when it is, what its current diagnosis
 * says. Answers the two questions a farm is entered with -- does this plot measure? does it ask for
 * anything? -- without opening each section one by one; name and stage alone are true from the day
 * it was created and always will be.
 *
 * TWO requests for the whole list, not two per card: `/devices` already carries each hub's section
 * and `lastSeen`, and `/recommendations` reduces to each device's latest.
 */
export const useSectionCoverage = (sectionIds: string[]) => {
  const [coverage, setCoverage] = useState<Record<string, SectionCoverage>>({});
  // Without this state the cards would appear with no chip or verdict and then fill in at once:
  // the user reads an incomplete card and rereads it when it changes.
  const [loading, setLoading] = useState(true);
  const key = sectionIds.join(',');

  const load = useCallback(async () => {
    if (sectionIds.length === 0) {
      setCoverage({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [hubs, diagnoses] = await Promise.all([
        sensorService.getAllSensors(),
        // Without a diagnosis the card still says whether it measures, which is useful already.
        fetchLatestDiagnoses().catch(
          () => ({}) as Awaited<ReturnType<typeof fetchLatestDiagnoses>>
        ),
      ]);
      const next: Record<string, SectionCoverage> = {};

      // Every section starts with no hub; those that have one overwrite it. So the "nothing was
      // assigned" case does not depend on the backend reporting it, but on the absence.
      sectionIds.forEach((id) => {
        next[id] = { kind: 'no-hub' };
      });

      hubs.forEach((hub) => {
        if (hub.sectionId == null) return;
        const id = String(hub.sectionId);
        if (!(id in next)) return; // hub de otra finca

        if (!hub.lastSeen) {
          next[id] = { kind: 'no-hub' };
          return;
        }

        // `hoursSince` reads the zoneless instant as UTC. With a bare `new Date` it reads as local
        // time and the 12 h threshold behaves like 17 h.
        const hours = hoursSince(hub.lastSeen) ?? 0;

        if (hours > STALE_AFTER_HOURS) {
          next[id] = { kind: 'stale', lastSeen: hub.lastSeen };
          return;
        }

        // The diagnosis only accompanies a reporting hub. With the sensor silent it describes the
        // plot yesterday, and presenting that as today's state is what the section detail avoids.
        const d = diagnoses[hub.deviceHubId];
        next[id] = {
          kind: 'reporting',
          lastSeen: hub.lastSeen,
          counts: d && !d.legacy ? d.counts : undefined,
        };
      });

      setCoverage(next);
    } catch (error) {
      // If the hubs cannot be queried, no state is invented: the cards come out with no chip.
      // Better to say nothing than to claim a plot is blind without knowing it.
      console.warn('No se pudo determinar la cobertura de las secciones', error);
      setCoverage({});
    } finally {
      setLoading(false);
    }
    // `key` pins the list's real identity; the array changes reference on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { coverage, loading, refreshCoverage: load };
};
