/**
 * The area of a geographic polygon, in hectares.
 *
 * The rule engine reasons in kg/ha (copper cap, per-hectare dose), but the app did not know how many
 * hectares the farm has, so it could not turn "you have X kg/ha left" into the concrete amount to buy.
 * Drawing the boundary gives that area, and this function comes from it.
 *
 * Uses the spherical-excess formula over the WGS84 ellipsoid -- the same as Leaflet.draw -- which for
 * plots of a few hectares is more than exact enough. No reprojection or geometry library needed; a
 * polygon in lat/lng is enough.
 */

/** Radio ecuatorial WGS84, en metros. */
const EARTH_RADIUS = 6378137;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** A coordinate as Leaflet handles it: [lat, lng]. */
export type LatLng = [number, number];

/**
 * The ring's area in square metres. Returns 0 with fewer than three vertices, because a polygon is not
 * defined before that -- exactly the state while the user is still drawing.
 */
export const polygonAreaM2 = (ring: LatLng[]): number => {
  const n = ring.length;
  if (n < 3) return 0;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const [lat1, lng1] = ring[i];
    const [lat2, lng2] = ring[(i + 1) % n];
    sum += (toRad(lng2) - toRad(lng1)) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((sum * EARTH_RADIUS * EARTH_RADIUS) / 2);
};

/** The same in hectares (1 ha = 10 000 m²), the unit the farmer works in. */
export const polygonAreaHa = (ring: LatLng[]): number => polygonAreaM2(ring) / 10000;

/**
 * Hectares formatted to show while drawing. Below one hectare it switches to square metres, how a
 * small plot is spoken of; above, one or two decimals by size, because "12.47 ha" is noise and
 * "0.4 ha" is not.
 */
export const formatArea = (ring: LatLng[]): string => {
  const ha = polygonAreaHa(ring);
  if (ha === 0) return '—';
  if (ha < 0.1) return `${Math.round(ha * 10000)} m²`;
  if (ha < 10) return `${ha.toFixed(2)} ha`;
  return `${ha.toFixed(1)} ha`;
};
