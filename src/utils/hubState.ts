import type { Sensor } from '../types/sensor.types';
import { freshnessLevel } from './freshness';
import { DEVICE_TOKENS, StatusToken, UNASSIGNED_TOKEN } from '../styles/statusTokens';

/**
 * What situation a hub is in NOW.
 *
 * The pill was painted from `devices.status`, a field nobody recomputes. The backend only writes it
 * from a device `POST`/`PUT` body (`Device.ReportedBy`), with `INACTIVE` by default; there is no
 * background job and no derivation from `last_seen`. A silent hub sends nothing, so it sends no notice
 * that it went silent: it stays `ACTIVE` forever. The pill said "Reporting" over a "seen 286 days
 * ago".
 *
 * Here the state is DERIVED from the last reading, the one datum that cannot lie: recent readings mean
 * the hub is alive, none mean it is not. It is what Farms, Sections and the detail already do through
 * `freshness.ts`; Hubs was the only view that did not.
 *
 * `MAINTENANCE` and `ERROR` drop out of the calculation because no backend route produces them: they
 * were unreachable options, like the sensor-type filter already removed.
 */
export type HubState = 'reporting' | 'silent' | 'unassigned' | 'never';

/**
 * Branch order matters: an unassigned hub that has also been silent for days counts as silent. The
 * silence is what has to be fixed in the field; the assignment is fixed from here in two clicks.
 */
export const hubStateOf = (hub: Pick<Sensor, 'lastSeen' | 'sectionId'>): HubState => {
  const level = freshnessLevel(hub.lastSeen);
  if (level === 'unknown') return 'never';
  if (level === 'silent') return 'silent';
  if (hub.sectionId == null) return 'unassigned';
  return 'reporting';
};

/**
 * Axis 2 of the colour system (device state), as the design report sets it: active green, no signal
 * AMBER, no data or unassigned grey. Never the severity terracotta -- a device going quiet is a
 * technical fact, not a request from the crop.
 */
export const hubStateTokens = (state: HubState): StatusToken => {
  switch (state) {
    case 'reporting':
      return DEVICE_TOKENS.ACTIVE;
    case 'silent':
      return DEVICE_TOKENS.MAINTENANCE;
    case 'unassigned':
      return UNASSIGNED_TOKEN;
    case 'never':
      return DEVICE_TOKENS.INACTIVE;
  }
};

/** i18n key for the short label that goes in the pill. */
export const hubStateLabelKey = (state: HubState): string => `hubs.state.${state}`;
