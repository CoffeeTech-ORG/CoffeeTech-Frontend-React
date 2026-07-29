import { useCallback, useEffect, useState } from 'react';
import api from '../services/api.client';
import API_ENDPOINTS from '../services/api.endpoints';
import { AgronomicEvent, AgronomicEventType } from '../types/api.types';

export interface AgronomicEventsState {
  events: AgronomicEvent[];
  loading: boolean;
  error?: string | null;
  refresh: () => Promise<void>;
  addEvent: (eventType: AgronomicEventType, eventDate: string, notes?: string) => Promise<void>;
  removeEvent: (id: number) => Promise<void>;
}

/**
 * A section's agronomic log. Append-only: each campaign records NEW events (the earlier ones are not
 * "unmarked"). To correct a wrong entry it is deleted.
 */
export function useAgronomicEvents(sectionId: string | number): AgronomicEventsState {
  const [events, setEvents] = useState<AgronomicEvent[]>([]);
  // At `false` the first frame hit `!events.length` and the log said "no entries yet" before asking
  // for them, on a section that has them.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (sectionId === undefined || sectionId === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AgronomicEvent[]>(
        `${API_ENDPOINTS.AGRONOMIC_EVENTS}?sectionId=${sectionId}`,
      );
      const list = Array.isArray(res.data) ? res.data : [];
      // Most recent first (the engine uses the latest of each type).
      list.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
      setEvents(list);
    } catch (err: any) {
      setError(err?.response?.data ?? err?.message ?? 'No se pudo cargar la bitácora');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEvent = useCallback(
    async (eventType: AgronomicEventType, eventDate: string, notes?: string) => {
      setError(null);
      try {
        await api.post(API_ENDPOINTS.AGRONOMIC_EVENTS, {
          sectionId: Number(sectionId),
          eventType,
          eventDate,
          notes: notes?.trim() ? notes.trim() : null,
        });
        await refresh();
      } catch (err: any) {
        setError(err?.response?.data ?? err?.message ?? 'No se pudo registrar el evento');
        throw err;
      }
    },
    [sectionId, refresh],
  );

  const removeEvent = useCallback(
    async (id: number) => {
      setError(null);
      try {
        await api.delete(`${API_ENDPOINTS.AGRONOMIC_EVENTS}/${id}`);
        await refresh();
      } catch (err: any) {
        setError(err?.response?.data ?? err?.message ?? 'No se pudo borrar el evento');
        throw err;
      }
    },
    [refresh],
  );

  return { events, loading, error, refresh, addEvent, removeEvent };
}

export default useAgronomicEvents;
