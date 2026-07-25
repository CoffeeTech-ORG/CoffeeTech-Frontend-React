/**
 * A point's altitude, from Open-Meteo's 90 m elevation model.
 *
 * The farm altitude used to be typed by hand, and it decides more than it seems: the engine uses it
 * to pick an ALTITUDE BAND, which changes the weight of four pest and disease rules. Typed 1450 m
 * where the hub is at 1823, the band comes out `medium` instead of `high`, dropping rust and borer
 * from alert to warning and reinforcing Phoma. One wrong digit changes the diagnosis.
 *
 * The same 90 m elevation model Open-Meteo uses for the engine's temperature downscaling, so the
 * derived altitude is consistent with the thermal correction by construction rather than mixing two
 * relief sources. Free, keyless, CC BY 4.0.
 *
 * It does NOT replace the declared one: the grower knows where they put the equipment and the DEM
 * smooths the relief (at the pilot the DEM gives 1702 m where the coordinates point and the hub is
 * at 1823). The derived value FILLS when there is nothing and WARNS when the two disagree. On any
 * failure it returns `null`: no altitude is invented without the network, as no point is invented
 * without a coordinate.
 */

const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';

/**
 * The difference above which it warns, in metres. It does not mean the grower is wrong: it means
 * the coordinate and the altitude are not describing the same point, which on a slope matters.
 * Around the pilot the terrain spans 1558-1726 m within a kilometre, so 100 m of difference is a
 * few hundred metres of horizontal pin error -- exactly what to look at before saving.
 */
export const ELEVATION_MISMATCH_M = 100;

/** Altitude in metres for a coordinate, or `null` if it cannot be known. */
export async function elevationFor(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): Promise<number | null> {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }
  try {
    const url = `${ELEVATION_URL}?latitude=${latitude}&longitude=${longitude}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const value = Array.isArray(data?.elevation) ? data.elevation[0] : data?.elevation;
    return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;
  } catch {
    // Third-party service with no SLA: its not answering must not block registering a farm. The
    // field stays empty and the grower fills it if they know it.
    return null;
  }
}

/** Do the declared and the map altitude agree? `null` when either is missing. */
export function elevationMismatch(
  declared: number | null | undefined,
  derived: number | null | undefined
): number | null {
  if (typeof declared !== 'number' || typeof derived !== 'number') return null;
  const diff = Math.abs(declared - derived);
  return diff > ELEVATION_MISMATCH_M ? Math.round(diff) : null;
}
