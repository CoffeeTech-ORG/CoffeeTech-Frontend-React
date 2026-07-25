import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { sensorService } from '../services/sensor.service';
import { fetchLatestDiagnoses, needsCropAction } from '../services/diagnosis.service';
import { STALE_AFTER_HOURS, hoursSince, parseInstant } from '../utils/freshness';

/**
 * Which group the farm falls in. Three DIFFERENT problems, kept apart:
 *
 *  `crop`   The crop asks for something today: the engine raised an alert. The only one that earns
 *           the agronomic-urgency colour.
 *  `device` Equipment was measuring and went silent. It needs checking -- actionable, but a device
 *           problem, not a plant one.
 *  `setup`  Not installed or configured: sections with no hub, or an unlocated farm. Not a fault
 *           or an urgency; pending work.
 *  `ok`     Everything reporting and no alerts.
 */
export type FarmTier = 'crop' | 'device' | 'setup' | 'ok';

export interface FarmOverview {
  sectionCount: number;
  /** Sections whose hub reported within the window. */
  reportingCount: number;
  /** Sections with no hub assigned, or whose hub never reported. Install work. */
  noHubCount: number;
  /** Sections whose hub reported and has been silent over 12 h. A fault. */
  silentCount: number;
  /** Sections with at least one engine alert. Crop urgency. */
  cropAlertCount: number;
  /** The farm's most recent reading. `null` if no section has ever reported. */
  lastSeen: string | null;
  tier: FarmTier;
}

interface SectionRow {
  id: number;
  farmId: number;
}

/**
 * Each farm's real state, so the list answers the question the app opens with: is there anything
 * to attend to?
 *
 * THREE requests for all farms, not three per farm: `/sections`, `/devices` and `/recommendations`
 * return the full list and the join is done in memory.
 *
 * The crop, the equipment and the install work are kept as separate counts. Folded into one
 * "needs attention" number and painted with the agronomic-urgency colour, a farm that only needs
 * equipment installed would shout the same as one whose crop is asking for potassium -- and with
 * one hub reporting across the base, that is eight farms in red for an install problem.
 */
export const useFarmOverview = (farmIds: string[]) => {
  const [overview, setOverview] = useState<Record<string, FarmOverview>>({});
  // Starts `true` because a fetch always runs on mount. At `false`, a consumer treats a state
  // that does not exist yet as settled, and an empty `overview` reads as "all fine": the panel
  // would claim the farms are up to date before looking at them.
  const [loading, setLoading] = useState(true);
  // An empty `overview` is ambiguous -- "not yet" or "could not" -- and the two paint
  // differently: wait, or warn. Never green.
  const [failed, setFailed] = useState(false);
  const key = farmIds.join(',');

  const load = useCallback(async () => {
    if (farmIds.length === 0) {
      setOverview({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setFailed(false);
    try {
      const [sectionsRes, hubs, diagnoses] = await Promise.all([
        api.get<SectionRow[]>('/sections'),
        sensorService.getAllSensors(),
        // If the diagnosis fails, carry on without it: coverage is valid on its own and beats
        // leaving the whole list stateless.
        fetchLatestDiagnoses().catch(
          () => ({}) as Awaited<ReturnType<typeof fetchLatestDiagnoses>>
        ),
      ]);

      // Which hub covers each section, since when it is silent, and what its last diagnosis says.
      const hubBySection = new Map<number, { lastSeen: string | null; hubId: string }>();
      hubs.forEach((hub) => {
        if (hub.sectionId != null) {
          hubBySection.set(hub.sectionId, {
            lastSeen: hub.lastSeen,
            hubId: hub.deviceHubId,
          });
        }
      });

      const next: Record<string, FarmOverview> = {};
      farmIds.forEach((id) => {
        next[id] = {
          sectionCount: 0,
          reportingCount: 0,
          noHubCount: 0,
          silentCount: 0,
          cropAlertCount: 0,
          lastSeen: null,
          tier: 'ok',
        };
      });

      (sectionsRes.data || []).forEach((section) => {
        const acc = next[String(section.farmId)];
        if (!acc) return; // a section of a farm not in this list

        acc.sectionCount += 1;

        const hub = hubBySection.get(section.id);
        // No hub, or one that never reported: install work, not a fault.
        if (!hub || !hub.lastSeen) {
          acc.noHubCount += 1;
          return;
        }

        // Same rule as the section list: a timezone-less instant is UTC.
        const hours = hoursSince(hub.lastSeen) ?? 0;
        if (hours > STALE_AFTER_HOURS) {
          acc.silentCount += 1;
        } else {
          acc.reportingCount += 1;
          // The crop is only judged on fresh data. With a silent sensor, the last diagnosis
          // describes the plot yesterday, not today.
          if (needsCropAction(diagnoses[hub.hubId])) acc.cropAlertCount += 1;
        }

        const seen = parseInstant(hub.lastSeen);
        const best = parseInstant(acc.lastSeen);
        if (seen && (!best || seen > best)) {
          acc.lastSeen = hub.lastSeen;
        }
      });

      // Order matters: the crop outranks a device, and a broken device outranks an install not
      // yet done.
      //
      // `setup` means NOTHING is measuring. One section without a hub must not send the whole farm
      // to "to configure": a farm with one plot reporting and healthy and another not installed
      // would read as "1 sin sensor", as if it had none. What is left to install is said in the
      // row, not by changing the farm's state.
      Object.values(next).forEach((f) => {
        f.tier =
          f.cropAlertCount > 0
            ? 'crop'
            : f.silentCount > 0
              ? 'device'
              : f.reportingCount === 0
                ? 'setup'
                : 'ok';
      });

      setOverview(next);
    } catch (error) {
      // The farm list is still useful without the state, so the screen is not blocked on a
      // secondary datum; but the failure is flagged so a renderer does NOT read it as "all fine",
      // which is what an empty `overview` alone would do.
      console.error('No se pudo calcular el estado de las fincas:', error);
      setOverview({});
      setFailed(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { overview, loading, failed, refresh: load };
};
