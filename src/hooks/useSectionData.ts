import { useCallback, useState, useEffect, useRef } from 'react';
import api, { setAuthToken } from '../services/api.client';
import API_ENDPOINTS from '../services/api.endpoints';
import { sensorService } from '../services/sensor.service';
import { Sensor } from '../types/sensor.types';
import { DataRecordRaw, DataRecord, Recommendation } from '../types/api.types';

/**
 * How often the sensor is re-read. In the field the hub reports every ~2 min, so polling faster
 * would only spend phone battery and mobile data.
 */
export const REFRESH_INTERVAL_MS = 120_000;

export interface SectionDataState {
  /** Initial load (or a section change) only. The periodic poll does NOT set it. */
  loading: boolean;
  /** A request is in flight over data already on screen. */
  refreshing: boolean;
  error?: Error | null;
  /** The hub measuring this section NOW, or null if none is installed. */
  hub: Sensor | null;
  dataRecord?: DataRecord | null;
  recommendations: Recommendation[];
  /** When (epoch ms) the next poll runs, for the panel's countdown. */
  nextRefreshAt: number | null;
  refresh: () => Promise<void>;
  setToken: (token: string | null) => void;
}

const normalizeDataRecord = (raw: DataRecordRaw | null): DataRecord | null => {
  if (!raw) return null;
  const getNumber = (v: any): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  return {
    id: raw.id,
    airHumidityPercent: getNumber(raw.airHumidityPercent),
    celciusGradeTemperature: getNumber(raw.celciusGradeTemperature ?? null),
    soilHumidityPercent: getNumber(raw.soilHumidityPercent),
    // precipitationDetected: keep the backend value as-is (0 or 1 or boolean)
    precipitationDetected: raw.precipitationDetected,
    nitrogen: getNumber(raw.nitrogen),
    phosphorus: getNumber(raw.phosphorus),
    potassium: getNumber(raw.potassium),
    timestamp: raw.timestamp ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
};

/**
 * Live section data: which hub measures it, its last reading and the engine diagnosis.
 *
 * The hub comes from `/devices`, not `/assignments`. `/assignments` returns ALL of the section's
 * assignments, including closed ones, and its resource does not expose `removedAt`, so the front
 * end cannot tell today's hub from one removed in March; taking the first would show the wrong
 * hub's readings in a section that changed equipment. `/devices` resolves the open period on the
 * server (`RemovedAt == null`), so each hub's `sectionId` is where it is installed NOW.
 */
export function useSectionData(
  initialToken: string | null,
  sectionId: string | number
): SectionDataState {
  // Starts `true` because a fetch ALWAYS runs on mount. At `false` the first frame has
  // `hub = null` and the view paints "this plot is not measured yet" before asking: an invented
  // answer for 300 ms, worse than a gap.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hub, setHub] = useState<Sensor | null>(null);
  const [dataRecord, setDataRecord] = useState<DataRecord | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [nextRefreshAt, setNextRefreshAt] = useState<number | null>(null);

  /** The current hub, so the poll need not resolve it again. */
  const hubIdRef = useRef<string | null>(null);

  const setToken = useCallback((t: string | null) => {
    setAuthToken(t);
  }, []);

  useEffect(() => {
    if (initialToken) setAuthToken(initialToken);
  }, [initialToken]);

  /** The hub's last reading + diagnosis. The only thing that changes between polls. */
  const fetchLive = useCallback(async (hubId: string) => {
    const [record, recs] = await Promise.all([
      api
        .get<DataRecordRaw>(`${API_ENDPOINTS.DATA_RECORDS}/latest/${encodeURIComponent(hubId)}`)
        .then((r) => normalizeDataRecord(r.data as DataRecordRaw))
        // 404 = the hub has not reported anything yet; not a failure.
        .catch(() => null),
      api
        .get<Recommendation[]>(API_ENDPOINTS.RECOMMENDATIONS)
        .then((r) => (r.data || []).filter((x) => String(x.deviceHubId) === String(hubId)))
        .catch(() => [] as Recommendation[]),
    ]);

    setDataRecord(record);
    setRecommendations(recs);
  }, []);

  /**
   * Full load: installed hub -> reading and diagnosis. `silent` is what makes polling possible:
   * clearing all state before fetching would flash the screen blank every two minutes on
   * auto-refresh, so in silent mode it writes over what is already shown.
   */
  const fetchAll = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const hubs = await sensorService.getAllSensors();
        const mine = hubs.find((h) => String(h.sectionId) === String(sectionId)) ?? null;
        setHub(mine);
        hubIdRef.current = mine?.deviceHubId ?? null;

        if (mine?.deviceHubId) {
          await fetchLive(mine.deviceHubId);
        } else {
          setDataRecord(null);
          setRecommendations([]);
        }
      } catch (err: any) {
        // In a silent poll the error does not wipe what the user is looking at: a passing
        // network failure must not turn a useful screen into an error one.
        if (!silent) setError(err);
        else console.warn('No se pudo actualizar la sección', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setNextRefreshAt(Date.now() + REFRESH_INTERVAL_MS);
      }
    },
    [sectionId, fetchLive]
  );

  const refresh = useCallback(async () => {
    await fetchAll(true);
  }, [fetchAll]);

  // Initial load and section change.
  useEffect(() => {
    fetchAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  /**
   * Polls every 2 minutes. Stops while the tab is backgrounded (battery and mobile data in the
   * field) and fetches immediately on return, which is when the user wants the current state.
   */
  useEffect(() => {
    let timer: number | undefined;

    const poll = () => {
      if (document.hidden) return;
      const hubId = hubIdRef.current;
      if (!hubId) return;
      setRefreshing(true);
      fetchLive(hubId)
        .catch((err) => console.warn('Sondeo del sensor fallido', err))
        .finally(() => {
          setRefreshing(false);
          setNextRefreshAt(Date.now() + REFRESH_INTERVAL_MS);
        });
    };

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(poll, REFRESH_INTERVAL_MS);
    };

    const onVisibility = () => {
      if (document.hidden) {
        window.clearInterval(timer);
        setNextRefreshAt(null);
      } else {
        poll();
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchLive]);

  return {
    loading,
    refreshing,
    error,
    hub,
    dataRecord,
    recommendations,
    nextRefreshAt,
    refresh,
    setToken,
  };
}
