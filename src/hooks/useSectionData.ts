import { useCallback, useState, useEffect } from 'react';
import api, { setAuthToken } from '../services/api.client';
import API_ENDPOINTS from '../services/api.endpoints';
import { Assignment, Device, DataRecordRaw, DataRecord, Recommendation } from '../types/api.types';

export interface SectionDataState {
  loading: boolean;
  error?: Error | null;
  assignments: Assignment[];
  selectedAssignment?: Assignment | null;
  device?: Device | null;
  dataRecord?: DataRecord | null;
  recommendations: Recommendation[];
  refresh: () => Promise<void>;
  setToken: (token: string | null) => void;
  selectAssignment: (assignmentId: string | number) => void;
}

export function useSectionData(initialToken: string | null, sectionId: string | number): SectionDataState {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [dataRecord, setDataRecord] = useState<DataRecord | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  // token state is intentionally not stored locally beyond setting it on the client
  const setToken = (t: string | null) => {
    setAuthToken(t);
  };

  // apply initial token to client when hook mounts or when initialToken changes
  useEffect(() => {
    if (initialToken) setAuthToken(initialToken);
  }, [initialToken]);

  const normalizeDataRecord = (raw: DataRecordRaw | null): DataRecord | null => {
    if (!raw) return null;
    const getNumber = (v: any): number | null => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    // handle misspelling
    const temp = raw.celsiusGradeTemperature ?? raw.celciusGradeTemperature ?? null;

    return {
      id: raw.id,
      airHumidityPercent: getNumber(raw.airHumidityPercent),
      celsiusGradeTemperature: getNumber(temp),
      soilHumidityPercent: getNumber(raw.soilHumidityPercent),
      precipitationDetected: raw.precipitationDetected === 'true' || raw.precipitationDetected === true,
      nitrogen: getNumber(raw.nitrogen),
      phosphorus: getNumber(raw.phosphorus),
      potassium: getNumber(raw.potassium),
      timestamp: raw.timestamp ?? null
    };
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAssignments([]);
    setSelectedAssignment(null);
    setDevice(null);
    setDataRecord(null);
    setRecommendations([]);

    try {
      // assignments
  const assignmentsRes = await api.get<Assignment[]>(API_ENDPOINTS.ASSIGNMENTS);
      const allAssignments = assignmentsRes.data || [];
      // filter by sectionId (no server-side filter assumed)
      const filtered = allAssignments.filter(a => String(a.sectionId) === String(sectionId));
      setAssignments(filtered);

      const useAssignment = filtered[0] ?? null;
      setSelectedAssignment(useAssignment);
      if (!useAssignment) {
        setLoading(false);
        return;
      }

      // device
  const deviceRes = await api.get<Device>(`${API_ENDPOINTS.DEVICES}/${useAssignment.deviceId}`);
      const d = deviceRes.data as Device;
      setDevice(d);

      // data record
      if (d?.dataRecordId) {
        try {
          const drRes = await api.get<DataRecordRaw>(`${API_ENDPOINTS.DATA_RECORDS}/${d.dataRecordId}`);
          const normalized = normalizeDataRecord(drRes.data as DataRecordRaw);
          setDataRecord(normalized);
        } catch (err) {
          // ignore individual data record error but surface a warning
          console.warn('Failed to load data record', err);
        }
      }

      // recommendations
      if (d?.deviceHubId) {
        try {
          const recRes = await api.get<Recommendation[]>(API_ENDPOINTS.RECOMMENDATIONS);
          const all = recRes.data || [];
          const filteredRec = all.filter(r => String(r.deviceHubId) === String(d.deviceHubId));
          setRecommendations(filteredRec);
        } catch (err) {
          console.warn('Failed to load recommendations', err);
        }
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  const refresh = async () => {
    await fetchAll();
  };

  const selectAssignment = (assignmentId: string | number) => {
    const found = assignments.find(a => String(a.id) === String(assignmentId)) ?? null;
    setSelectedAssignment(found);
    // when selecting a different assignment, re-run fetch for device and data
    if (found) {
      (async () => {
        setLoading(true);
        try {
          const deviceRes = await api.get<Device>(`${API_ENDPOINTS.DEVICES}/${found.deviceId}`);
          const d = deviceRes.data as Device;
          setDevice(d);
          if (d?.dataRecordId) {
            try {
              const drRes = await api.get<DataRecordRaw>(`${API_ENDPOINTS.DATA_RECORDS}/${d.dataRecordId}`);
              setDataRecord(normalizeDataRecord(drRes.data as DataRecordRaw));
            } catch (err) {
              setDataRecord(null);
            }
          } else {
            setDataRecord(null);
          }

          if (d?.deviceHubId) {
            try {
              const recRes = await api.get<Recommendation[]>(API_ENDPOINTS.RECOMMENDATIONS);
              const all = recRes.data || [];
              setRecommendations(all.filter(r => String(r.deviceHubId) === String(d.deviceHubId)));
            } catch (err) {
              setRecommendations([]);
            }
          } else {
            setRecommendations([]);
          }

        } catch (err) {
          setError(err as Error);
        } finally {
          setLoading(false);
        }
      })();
    }
  };

  // initial fetch and re-fetch when sectionId (fetchAll) changes
  // Note: consumers can still call refresh() manually; we auto-run on mount and when sectionId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    loading,
    error,
    assignments,
    selectedAssignment,
    device,
    dataRecord,
    recommendations,
    refresh,
    setToken,
    selectAssignment
  };
}
