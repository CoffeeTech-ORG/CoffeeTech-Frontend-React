/**
 * Daily rainfall in millimetres from the regional reanalysis, for a farm's point.
 *
 * The hub sensor says WHETHER it rained, not how much: its rain is a boolean. The millimetres are
 * not on the plot and cannot be got from it, so they can only come from the regional model. That
 * fits the project's rule -- the API is for data the sensor does NOT have -- but forces presenting
 * them for what they are.
 *
 * What these millimetres are NOT: the farm's rain. They are a 9 km cell's, in relief where the
 * terrain spans 1558-1726 m within a kilometre. And the product matters more than it seems: over
 * 2023-2025 at the pilot's coordinates, ECMWF IFS gives 861 mm/year and ERA5 gives 2442, nearly
 * triple for the same point and period. So `models=ecmwf_ifs` is pinned -- the same product the
 * engine's mm thresholds come from -- or a change to the default would move the figure out of step
 * with the diagnosis and nobody would notice.
 *
 * Nor are they contrasted with a rain gauge. Peru has station-merged products (PISCO, RAIN4PE) that
 * would be the natural contrast; they are not implemented. The band label says so.
 */

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

/**
 * The product, PINNED. Open-Meteo's archive serves the operational ECMWF IFS reanalysis at 9 km
 * from 2017 by default (not ERA5), requested explicitly here so a change to the default cannot move
 * the figure unnoticed.
 */
const ARCHIVE_MODEL = 'ecmwf_ifs';

/** First date with ECMWF IFS. Before it there is only ERA5-Land, a different series. */
const ARCHIVE_IFS_SINCE = '2017-01-01';

export interface RegionalRainDay {
  /** `YYYY-MM-DD`. */
  date: string;
  /** The day's millimetres, or `null` if the archive lacks them. */
  mm: number | null;
}

/**
 * The reanalysis' daily rain between two dates, or `null` if it cannot be known. `altitude` is
 * passed to the API as-is: it enables downscaling with the 90 m elevation model, the same the
 * engine uses. Without it the series describes the DEM's altitude at the point and not the farm's,
 * which on a slope are different.
 */
export async function regionalRainDaily(
  latitude: number | null,
  longitude: number | null,
  startDate: string,
  endDate: string,
  altitude?: number | null
): Promise<RegionalRainDay[] | null> {
  if (latitude === null || longitude === null) return null;
  if (startDate < ARCHIVE_IFS_SINCE) return null;   // otra serie: no se mezcla

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: startDate,
    end_date: endDate,
    daily: 'precipitation_sum',
    timezone: 'America/Lima',
    models: ARCHIVE_MODEL
  });
  if (typeof altitude === 'number') params.set('elevation', String(altitude));

  try {
    const res = await fetch(`${ARCHIVE_URL}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const days: string[] = data?.daily?.time ?? [];
    const mm: (number | null)[] = data?.daily?.precipitation_sum ?? [];
    if (!days.length) return null;
    return days.map((date, i) => ({
      date,
      mm: typeof mm[i] === 'number' ? mm[i] : null
    }));
  } catch {
    // Third-party service: its not answering must not take down the report, which is of measured
    // data. The band simply does not appear.
    return null;
  }
}
