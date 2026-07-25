import { LatLng } from '../components/MapView/BoundaryLayer';

/**
 * Conversion between the boundary as the app uses it (`[lat, lng][]`, Leaflet's order) and the GeoJSON
 * the backend stores.
 *
 * GeoJSON has two quirks to respect or the polygon comes out wrong: the order is `[lng, lat]`, the
 * reverse of Leaflet's; and the ring must be CLOSED, the last point repeating the first. The app does
 * not store that duplicate point (geoman closes it on draw), so it is added on export and removed on
 * import.
 *
 * Carried as JSON text, not an object: the column is JSON in MySQL and a string crosses the API
 * without the backend's mapping having to know the polygon's shape.
 */

interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

/** Boundary -> GeoJSON text to send to the backend. `null` if it is not a full polygon. */
export const ringToGeoJsonString = (ring: LatLng[] | null | undefined): string | null => {
  if (!ring || ring.length < 3) return null;

  const coords = ring.map(([lat, lng]) => [lng, lat] as [number, number]);
  const [firstLng, firstLat] = coords[0];
  const [lastLng, lastLat] = coords[coords.length - 1];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    coords.push([firstLng, firstLat]);
  }

  const polygon: GeoJsonPolygon = { type: 'Polygon', coordinates: [coords] };
  return JSON.stringify(polygon);
};

/**
 * The backend's GeoJSON -> a boundary for the app. Accepts raw text or an already-parsed object,
 * because MySQL/EF may return either. Returns `null` for anything that is not a valid polygon: a
 * half-boundary is worse than none.
 */
export const geoJsonToRing = (value: unknown): LatLng[] | null => {
  if (value == null) return null;

  let poly: GeoJsonPolygon;
  try {
    poly = (typeof value === 'string' ? JSON.parse(value) : value) as GeoJsonPolygon;
  } catch {
    return null;
  }

  const outer = poly?.coordinates?.[0];
  if (!Array.isArray(outer) || outer.length < 3) return null;

  const ring = outer.map(([lng, lat]) => [lat, lng] as LatLng);

  // Drop the duplicate closing point GeoJSON requires but the app does not handle.
  if (ring.length > 3) {
    const [firstLat, firstLng] = ring[0];
    const [lastLat, lastLng] = ring[ring.length - 1];
    if (firstLat === lastLat && firstLng === lastLng) ring.pop();
  }

  return ring.length >= 3 ? ring : null;
};
