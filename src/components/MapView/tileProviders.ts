/**
 * Where the map tiles come from, and up to what zoom each provider has real imagery.
 *
 * MapTiler is measured and discarded. Esri runs out of imagery at z=18 (past it, a grey tile with
 * "Map data not yet available") while MapTiler keeps returning something -- but returning an image is
 * not having more detail. Comparing the SAME terrain at the SAME pixel count -- MapTiler tiles (512 px
 * native) against Esri's (256 px) scaled to 512 -- edge energy was:
 *
 *   Los Cedros    MapTiler 2.00  ·  Esri 3.57
 *   El cautivo    MapTiler 2.10  ·  Esri 3.64
 *   Lima centre   MapTiler 6.24  ·  Esri 16.37
 *
 * Esri wins all three, urban included. MapTiler's satellite image is simply lower resolution, so
 * switching to it past z=18 made things worse -- the "jump to blurry" at the last two levels. So a
 * single satellite source, Esri, scaled beyond its native resolution. Scaling the SAME image reads as
 * zooming in; switching to a worse one reads as a fault.
 *
 * `maxNativeZoom` is the HIGHEST level the provider has real imagery for. Without it Leaflet requests
 * tiles that do not exist and the grey sign appears. With it, it rescales the last real tile: softer,
 * but visible -- and for placing points precisely, being able to magnify helps even when the image
 * gains no detail.
 */

export interface TileProvider {
  url: string;
  attribution: string;
  /** Last level with real imagery. Past it, Leaflet rescales instead of requesting in vain. */
  maxNativeZoom: number;
  /** How far the user is allowed to zoom in. */
  maxZoom: number;
  /**
   * The MAP zoom range in which the layer is MOUNTED. Applied by `SatelliteLabels` by adding and
   * removing the layer from the tree, NOT the `TileLayer`'s `minZoom`/`maxZoom` props.
   *
   * On purpose: `maxZoom` on the `TileLayer` does not hide the layer, it scales it -- a z11 tile
   * stretched to z15 is giant blurry lettering. Mounting and unmounting is the only thing that makes
   * it truly disappear. `undefined` = no limit on that side.
   */
  showFrom?: number;
  showTo?: number;
}

export const STREET: TileProvider = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxNativeZoom: 19,
  maxZoom: 20,
};

export const SATELLITE: TileProvider = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  // Over the project's farms the real imagery ends here; measured.
  maxNativeZoom: 18,
  // Two more levels are allowed, scaling the z=18 image. Needed for placing vertices precisely, and
  // better than a hard cap that stops fine adjustment.
  maxZoom: 20,
};

/**
 * Transparent labels over the satellite.
 *
 * A pure satellite image has not one name: over a hillside coffee plot it is all identical trees,
 * with no town or road to place yourself. And unlike the street map, where names read from afar, here
 * the user can get lost.
 *
 * Two sources, SPLIT by zoom rather than overlaid, so they never coincide -- overlaid, they produced
 * duplicated names on top of each other and English labels. Compared tile by tile over the same area
 * (not by pixel density, which counts how much ink a layer lays without looking at WHAT it says or in
 * what language):
 *
 *            z<=9                   z10-11            z12-14        z>=15
 *   CARTO    "DEPARTMENT OF         clean             clean         ONLY one with content
 *             PIURA" in ENGLISH     (place names)                   (2.2 -> 5.1 %)
 *   Esri     Spanish + borders      Spanish, richer   Spanish       empty
 *            (Tumbes, Machala,      than CARTO        (1.0-1.6 %)
 *             Loja, Piura)          (6.8 % vs 0.8 %)
 *
 * Each is right exactly where the other fails, so they take turns and never coincide: at z <= 11,
 * Esri (the only correct language low down, and denser at z10-11); at z >= 12, CARTO (no English
 * administrative names there, and the only one still with anything past z15, where the farm is looked
 * at). The 11/12 cut is not arbitrary: CARTO's "DEPARTMENT OF ..." disappear from z10 (checked over
 * Piura -- z9 has them, z10 does not) with a level of margin left.
 *
 * On CARTO's English: OSM stores those administrative names in their English form and the style draws
 * them in far views, over the same-named city -- the layer duplicating itself. `voyager_only_labels`
 * is identical, same "DEPARTMENT OF". It is the data, not the style.
 *
 * One known remainder: Esri labels oceans in English ("Pacific Ocean") at very far zooms over sea. It
 * does not affect farm views, which are over land.
 *
 * Hamlet density is LOWER than in the "Map" view, and expected. Measured tile by tile over the same
 * area at z12-z13, both CARTO and Esri (the two free labels-only layers) carry 0-1 labels, while OSM
 * embeds them in a full render with a much denser policy. No free labels-only layer matches that
 * density; getting it needs a paid "hybrid" layer (Mapbox/MapTiler/Google Hybrid), discarded on cost.
 * It is what Google or Bing do too: their satellite labels less than their map mode. For hamlet
 * detail, the user has the Map view one tap away.
 *
 * Roads go off approaching the town (z >= 15): Esri's roads layer is the ONLY one drawing street lines
 * (CARTO only places names, and the "grey" lines that seemed to compete are the real streets in the
 * photo itself). Measured tile by tile over San Ignacio: at z11-z14 it draws only the main roads --
 * they orient between valleys and do not get in the way -- but at z15 the whole urban grid appears in
 * yellow, right over the same streets already visible in the satellite. There it only clutters and
 * duplicates, so it is removed; CARTO keeps placing the street names.
 */
export const SATELLITE_OVERLAYS: TileProvider[] = [
  {
    // Road lines. Up to z14: main roads only, useful for orienting. At z15 the whole urban grid
    // appears in yellow over the satellite's real streets, so it is removed there -- the only layer
    // that draws street lines.
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    attribution: '',
    maxNativeZoom: 18,
    maxZoom: 20,
    showTo: 14,
  },
  {
    // Far and mid views: Spanish names and the Ecuador/Peru border. Off at z12 so it never
    // coincides with CARTO -- where the duplicated names came from.
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '',
    maxNativeZoom: 11,
    maxZoom: 11,
    showTo: 11,
  },
  {
    // From z12 on: districts, hamlets and street names. Starts where Esri ends, and only there,
    // because below it puts department names in English.
    url: 'https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 19,
    maxZoom: 20,
    showFrom: 12,
  },
];
