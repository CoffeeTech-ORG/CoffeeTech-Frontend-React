/**
 * Place search and reverse geocoding over Photon (OpenStreetMap data): free, keyless and built for
 * autocomplete, unlike Nominatim, whose policy forbids it, and unlike the paid Google APIs.
 *
 * A third-party public service with no SLA: if it does not answer, the app must still let a farm be
 * located by GPS or by dragging the pin, so failures map to "no suggestions", never a form error.
 */

const PHOTON = 'https://photon.komoot.io';

/**
 * Reference point to bias results toward (Cajamarca, the project's coffee region). A BIAS, not a
 * filter: Peruvian places come first, the rest of the world stays available. Without it, "San
 * Ignacio" also offers one in Belize.
 */
const BIAS = { lat: -5.12, lon: -79.02 };

/** A place, normalised. The rest of the app should not know Photon's shape. */
export interface PlaceResult {
  /** Readable text: "San Ignacio, Cajamarca, Perú". */
  label: string;
  /** What it is: "Provincia", "Distrito", "Caserío". Tells same-named places of different size apart. */
  kind?: string;
  latitude: number;
  longitude: number;
}

interface PhotonFeature {
  properties: {
    name?: string;
    street?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    /** The datum's family in OSM: `place`, `boundary`, `highway`, `amenity`... */
    osm_key?: string;
    /** Granularidad: `county`, `city`, `district`, `locality`, `house`, `street`… */
    type?: string;
  };
  /** MIND: Photon returns them as [lon, lat], the reverse of the usual order. */
  geometry: { coordinates: [number, number] };
}

/**
 * Populated places and administrative divisions only. "San Ignacio" also returns a clinic by that
 * name and two avenues, which push the useful answer down. `place` covers towns and villages,
 * `boundary` covers districts and provinces.
 */
const RELEVANT_KEYS = new Set(['place', 'boundary']);

/**
 * What each result is. Without it, a same-named province, district and town show the SAME label:
 * "San Ignacio" gives three visually identical options the user cannot choose between.
 */
const TYPE_LABELS: Record<string, string> = {
  country: 'País',
  state: 'Región',
  county: 'Provincia',
  city: 'Distrito',
  district: 'Pueblo',
  locality: 'Caserío',
  village: 'Caserío',
  hamlet: 'Caserío',
};

/** Joins "specific, intermediate, general" without repeats or orphan commas. */
const toLabel = (p: PhotonFeature['properties']): string => {
  const partes = [p.name || p.street, p.city, p.county, p.state, p.country];
  const vistos = new Set<string>();
  return partes
    .filter((x): x is string => !!x && !vistos.has(x) && !!vistos.add(x))
    .join(', ');
};

const toPlace = (f: PhotonFeature): PlaceResult => ({
  label: toLabel(f.properties),
  kind: f.properties.type ? TYPE_LABELS[f.properties.type] : undefined,
  // Reversed here, once, so nobody else has to remember it.
  latitude: f.geometry.coordinates[1],
  longitude: f.geometry.coordinates[0],
});

/**
 * Suggestions for what the user is typing. `signal` allows cancelling: typing fast, an old query's
 * response can arrive after the new one and overwrite the list.
 *
 * `lang=default` is sent ALWAYS and explicitly. Photon only accepts `default`, `de`, `en`, `fr`;
 * `lang=es` returns HTTP 400. Omitted, Photon negotiates with the browser's `Accept-Language`,
 * usually English, and returns "Department of Cajamarca, Peru" instead of "Cajamarca, Perú" --
 * names the farmer does not recognise and which do not match what farms already store. `default`
 * returns the place name in the place's own language.
 */
export const searchPlaces = async (
  query: string,
  signal?: AbortSignal
): Promise<PlaceResult[]> => {
  const q = query.trim();
  if (q.length < 3) return [];

  const url =
    `${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=6` +
    `&lat=${BIAS.lat}&lon=${BIAS.lon}&lang=default`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();

    const features: PhotonFeature[] = data.features ?? [];
    const relevantes = features.filter((f) =>
      RELEVANT_KEYS.has(f.properties.osm_key ?? '')
    );
    // If the filter empties the list, show what there is: an imperfect result beats a dead end.
    const base = relevantes.length > 0 ? relevantes : features;

    // Two entries with the same text AND type are indistinguishable on screen.
    const vistos = new Set<string>();
    return base
      .map(toPlace)
      .filter((p) => {
        if (!p.label) return false;
        const clave = `${p.label}|${p.kind ?? ''}`;
        if (vistos.has(clave)) return false;
        vistos.add(clave);
        return true;
      });
  } catch (error) {
    // `AbortError` is normal while typing: not a failure to report.
    if ((error as Error)?.name !== 'AbortError') {
      console.error('No se pudo buscar el lugar:', error);
    }
    return [];
  }
};

/**
 * Coordinate -> readable text, used after GPS to fill the place name. Returns `null` if there is
 * nothing reasonable; the caller tolerates it and leaves the field as-is rather than inventing.
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    // `lang=default` for the same reason as in `searchPlaces`: without it the browser header
    // makes it return place names in English.
    const res = await fetch(
      `${PHOTON}/reverse?lat=${latitude}&lon=${longitude}&limit=1&lang=default`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    return feature ? toLabel(feature.properties) || null : null;
  } catch (error) {
    console.error('No se pudo resolver la dirección:', error);
    return null;
  }
};
