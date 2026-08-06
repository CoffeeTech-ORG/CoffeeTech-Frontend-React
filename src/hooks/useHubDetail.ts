import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Sensor } from '../types/sensor.types';
import { sensorService } from '../services/sensor.service';
import { farmsService, Assignment, Section } from '../services/farms.service';
import api from '../services/api.client';
import { API_ENDPOINTS } from '../services/api.endpoints';
import { ReportData } from '../types/report.types';
import { parseInstant } from '../utils/freshness';
import { sensorRhythm } from '../utils/downsample';

/** A history period, already resolved with its section name. */
export interface HubPlacement {
  id: number;
  sectionId: number;
  sectionName: string | null;
  installedAt: string;
  removedAt: string | null;
  open: boolean;
}

export interface HubDetailState {
  hub: Sensor | null;
  /** The hub's periods, most recent to oldest. */
  history: HubPlacement[];
  /** Sections with no hub today. The only ones this can be assigned to. */
  freeSections: Array<{ id: number; name: string }>;
  /**
   * How many milliseconds between reports, MEASURED over the last week. `null` = could not be
   * measured, and then the UI says nothing rather than inventing a figure.
   */
  cadenceMs: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Everything the hub detail needs.
 *
 * The cadence is MEASURED, not written. Hard-coding "every 2 minutes" would assert something
 * unchecked: if the device changed to every ten, the screen would still say two. A bounded window
 * is requested from the reports endpoint -- by the hub's section, one per section -- and passed
 * through `sensorRhythm`, the same calculation the chart uses to decide what a gap is.
 *
 * The window is ONE WEEK. At 24 h the line almost always vanishes: a hub silent for a day -- the
 * case where knowing its usual cadence matters most -- leaves nothing to measure. And since
 * `sensorRhythm` takes the MEDIAN of the intervals, more samples give a steadier figure, not an
 * older one.
 *
 * An unassigned hub has no section to ask about, so it gets no figure: its readings are tied to no
 * plot.
 */
export const useHubDetail = (hubId?: string): HubDetailState & { reload: () => Promise<void> } => {
  const [state, setState] = useState<HubDetailState>({
    hub: null,
    history: [],
    freeSections: [],
    cadenceMs: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    const id = Number(hubId);
    if (!hubId || Number.isNaN(id)) {
      setState((s) => ({ ...s, loading: false, error: null, hub: null }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // All hubs are fetched, not one: the full list is needed to know which sections are taken,
      // so the assign selector does not offer a plot that would leave another without equipment.
      const [hubs, assignments, sections] = await Promise.all([
        sensorService.getAllSensors(),
        farmsService.listAssignments().catch(() => [] as Assignment[]),
        farmsService.listAllSections().catch(() => [] as Section[]),
      ]);

      const hub = hubs.find((h) => h.id === id) ?? null;
      if (!hub) {
        setState({ hub: null, history: [], freeSections: [], cadenceMs: null, loading: false, error: null });
        return;
      }

      const nameOf = (sectionId: number) =>
        sections.find((s) => String(s.id) === String(sectionId))?.name ?? null;

      const history: HubPlacement[] = assignments
        .filter((a) => a.deviceId === id)
        .map((a) => ({
          id: a.id,
          sectionId: a.sectionId,
          sectionName: nameOf(a.sectionId),
          installedAt: a.installedAt,
          removedAt: a.removedAt,
          open: a.removedAt == null,
        }))
        .sort((a, b) => (parseInstant(b.installedAt)?.getTime() ?? 0) - (parseInstant(a.installedAt)?.getTime() ?? 0));

      const taken = new Set(hubs.map((h) => h.sectionId).filter((s): s is number => s != null));
      const freeSections = sections
        .filter((s) => !taken.has(Number(s.id)))
        .map((s) => ({ id: Number(s.id), name: s.name }));

      setState({
        hub,
        history,
        freeSections,
        cadenceMs: await measureCadence(hub),
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'No se pudo cargar el hub',
      }));
    }
  }, [hubId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
};

/** `null` when there is nothing to measure with. Never a default figure. */
const measureCadence = async (hub: Sensor): Promise<number | null> => {
  if (hub.sectionId == null) return null;

  try {
    const params = new URLSearchParams({
      sectionId: String(hub.sectionId),
      startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    });
    const { data } = await api.get(`${API_ENDPOINTS.REPORTS_DATA}?${params}`);
    if (!Array.isArray(data)) return null;

    const puntos = (data as ReportData[])
      .map((d) => ({ t: parseInstant(String(d.timestamp))?.getTime() ?? NaN }))
      .filter((p) => !Number.isNaN(p.t))
      .sort((a, b) => a.t - b.t);

    return sensorRhythm(puntos);
  } catch {
    // Failing to measure the cadence does not invalidate the rest of the detail: that line stays
    // quiet and the rest of the screen still works.
    return null;
  }
};
