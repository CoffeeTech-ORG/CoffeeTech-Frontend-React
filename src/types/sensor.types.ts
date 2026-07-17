/**
 * Types for the Hub inventory.
 *
 * Each row is a HUB: the per-section ESP32 that collects what the Nodes send it and averages it. The
 * instruments (NPK CWT-SOIL-NPK-S, DHT22, capacitive soil moisture v1.2, FC-37) live in the Nodes and
 * are not inventoried.
 *
 * The name `Sensor` is kept because the view components use it, but the resource the backend returns
 * is `Device` (`GET /api/v1/devices`). The two tables for the same hub -- `sensors`, written by the
 * Raspberry Pi, and `devices`, created by the Manager by hand -- were merged into `devices`, the name
 * all three layers already used.
 *
 * The `type` field is gone: a Hub always aggregated the four instruments, so it was COMBINED on every
 * row. And `location` does not exist either: where a hub is comes from its assignment to a section,
 * which can change over time.
 */

// Type only: `hubState` imports `Sensor` back, and with `import type` the cycle is erased at compile
// time instead of existing at runtime.
import type { HubState } from '../utils/hubState';

/** A Hub as `GET /api/v1/devices` returns it. */
export interface Sensor {
  id: number;
  /** The hub's MAC. Its identity; it has a unique index in the database. */
  deviceHubId: string;
  /**
   * NOT used to decide what is drawn. The API contract keeps it, not the system.
   *
   * The backend only writes it from a device `POST`/`PUT` body (`Device.ReportedBy`), with `INACTIVE`
   * by default, and nothing recomputes it afterwards: a hub that dies stays `ACTIVE` forever, because
   * a silent hub does not send the notice that it went silent. `MAINTENANCE` and `ERROR` are produced
   * by no code path.
   *
   * The real state is derived from `lastSeen` in `utils/hubState.ts`. The field stays here in case the
   * backend ever maintains it.
   */
  status: SensorStatus;
  /** Last report received. null if the hub never reported. The source of truth. */
  lastSeen: string | null;
  /**
   * The section it is installed in NOW. null = unassigned.
   *
   * "Which section it serves" is an attribute of the hub: it answers what the device exists for. The
   * null case matters as much as the rest -- an unassigned hub reports data that reaches no plot, and
   * the model still computes recommendations for it that nobody sees.
   */
  sectionId: number | null;
  sectionName: string | null;
  farmName: string | null;
  /** The assignment's open period. Needed to close it from "Remove". */
  assignmentId: number | null;
  /** Since when it has been installed in that section. */
  installedAt: string | null;
}

export type SensorStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'MAINTENANCE'
  | 'ERROR';

export interface SensorFormData {
  deviceHubId: string;
  status?: SensorStatus;
  lastSeen?: string;
}

export interface SensorFilters {
  /**
   * DERIVED states (`utils/hubState.ts`), not the stored `status`.
   *
   * A list and not a single value because one summary card can cover more than one state: "no signal"
   * groups the hub that went quiet with the one that never spoke. The row does tell the two apart --
   * they are not the same -- but for filtering they are the same question: which are not sending.
   */
  states?: HubState[];
  searchTerm?: string;
}

/**
 * The inventory summary, on the axis the user can act on.
 *
 * It answers the questions that have an answer: how many there are, how many are sending, how many
 * went quiet and how many serve no plot -- not the four `SensorStatus`, of which two were unreachable
 * and one could be months out of date.
 */
export interface SensorStats {
  total: number;
  reporting: number;
  silent: number;
  unassigned: number;
  /** Never reported. Counted apart from `silent`: going quiet is not the same as never speaking. */
  never: number;
}
