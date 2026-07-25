import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

export type LatLng = [number, number];

/**
 * What the outer editor needs to drive the drawing. Exposed through a `ref` because the buttons
 * live in the modal chrome, outside the map, with no access to the Leaflet object.
 */
export interface BoundaryController {
  /** Drops the last vertex: while drawing the one just placed, once closed the ring's last. */
  undo: () => void;
  /** Clears the boundary and leaves the map ready to draw again. */
  clear: () => void;
  /**
   * Closes the polygon in progress. This is the reliable way to finish: geoman's double click is
   * unreliable on touch and clicking the first vertex needs precision.
   */
  finish: () => void;
  /** Whether a drawing is in progress or a polygon is placed, to enable/disable the buttons. */
  hasShape: () => boolean;
}

interface BoundaryLayerProps {
  /** Initial boundary, when editing a farm that already has one. */
  boundary: LatLng[] | null;
  /** Draw mode: turns geoman on. Without it the polygon renders but cannot be touched. */
  draw?: boolean;
  /** `closed` tells an already-closed (editable) polygon from one still being traced. */
  onChange?: (ring: LatLng[], closed: boolean) => void;
  controllerRef?: React.MutableRefObject<BoundaryController | null>;
}

// Terracotta, same family as the farm pin. Very light fill so the imagery underneath shows.
const SHAPE_STYLE: L.PathOptions = {
  color: '#e0742f',
  weight: 2,
  fillColor: '#e0742f',
  fillOpacity: 0.12,
};

/** A Leaflet polygon's vertices as `[lat, lng][]`, the order used across the app. */
const ringOf = (layer: L.Polygon): LatLng[] => {
  const first = (layer.getLatLngs()[0] as L.LatLng[]) ?? [];
  return first.map((ll) => [ll.lat, ll.lng] as LatLng);
};

/**
 * Vertices of the layer geoman builds WHILE drawing. It is a temporary polyline, an unclosed
 * ring, so its `getLatLngs()` come back flat rather than nested as in a closed polygon.
 */
const workingRing = (layer: L.Polyline): LatLng[] => {
  const raw = layer.getLatLngs() as L.LatLng[] | L.LatLng[][];
  const flat = (Array.isArray(raw[0]) ? raw[0] : raw) as L.LatLng[];
  return flat.map((ll) => [ll.lat, ll.lng] as LatLng);
};

/**
 * geoman's polygon drawer with the shape it actually has at runtime. Its types declare
 * `Draw.Polygon` as `DrawShape | Function` and expose neither `enabled()` nor
 * `_removeLastVertex()`, so the narrowing lives here instead of a cast at every use.
 */
const polygonDrawer = (map: L.Map) =>
  (
    map.pm.Draw as unknown as {
      Polygon?: {
        enabled?: () => boolean;
        _removeLastVertex?: () => void;
        _finishShape?: () => void;
        _layer?: L.Polyline;
      };
    }
  ).Polygon;

/**
 * Draws and edits a farm boundary on the map, with leaflet-geoman.
 *
 * geoman's own toolbar is not used: `FarmBoundaryEditor` provides large buttons instead, because
 * the toolbar is small desktop icons and this gets drawn with a finger in the field. This
 * component only turns draw/edit mode on and reports changes.
 */
export const BoundaryLayer: React.FC<BoundaryLayerProps> = ({
  boundary,
  draw,
  onChange,
  controllerRef,
}) => {
  const map = useMap();
  const layerRef = useRef<L.Polygon | null>(null);
  // The temporary polyline while drawing: needed for the live area and to report the ring after
  // undoing a vertex mid-draw.
  const workingRef = useRef<L.Polyline | null>(null);
  // Kept in refs so the mount effect does not depend on their identity and re-arm on every
  // parent render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    if (!draw) return;

    // geoman's hints in Spanish, so the map does not speak two languages.
    map.pm.setLang('es');

    // No geoman toolbar; the buttons belong to the editor.
    map.pm.setGlobalOptions({
      snappable: true,
      templineStyle: SHAPE_STYLE,
      hintlineStyle: SHAPE_STYLE,
      pathOptions: SHAPE_STYLE,
    } as never);

    // Live area while drawing. geoman does not emit `pm:create` until the ring closes, and its
    // `pm:vertexadded` does not arrive reliably, neither on the map nor on the temporary layer
    // after starting over. The map's `click` always fires, so the vertices are read from the
    // drawer (`_layer`) after it; `setTimeout(0)` lets geoman add the vertex first.
    const onMapClick = () => {
      const drawer = polygonDrawer(map);
      if (!drawer?.enabled?.()) return;
      setTimeout(() => {
        // Re-check that drawing is STILL in progress. If the click landed on the first vertex,
        // geoman has already closed the polygon and emitted `pm:create` with `closed=true`, and
        // reporting `closed=false` here would revert it, flickering the Save button off.
        const d = polygonDrawer(map);
        if (!d?.enabled?.() || !d._layer) return;
        workingRef.current = d._layer;
        onChangeRef.current?.(workingRing(d._layer), false);
      }, 0);
    };
    map.on('click', onMapClick);

    const enableEditOn = (poly: L.Polygon) => {
      poly.pm.enable({ allowSelfIntersection: false });
      poly.on('pm:edit', () => onChangeRef.current?.(ringOf(poly), true));
      poly.on('pm:markerdragend', () => onChangeRef.current?.(ringOf(poly), true));
      poly.on('pm:vertexremoved', () => onChangeRef.current?.(ringOf(poly), true));
    };

    // One boundary per farm: each new polygon replaces the previous one.
    const onCreate = (e: { layer: L.Layer }) => {
      const poly = e.layer as L.Polygon;
      if (layerRef.current && layerRef.current !== poly) {
        map.removeLayer(layerRef.current);
      }
      poly.setStyle(SHAPE_STYLE);
      layerRef.current = poly;
      enableEditOn(poly);
      onChangeRef.current?.(ringOf(poly), true);
    };
    map.on('pm:create', onCreate);

    // Start: with an existing boundary, render it editable; without one, start drawing.
    if (boundary && boundary.length >= 3) {
      const poly = L.polygon(boundary, SHAPE_STYLE).addTo(map);
      layerRef.current = poly;
      enableEditOn(poly);
    } else {
      map.pm.enableDraw('Polygon', { finishOn: 'dblclick' } as never);
    }

    return () => {
      map.off('pm:create', onCreate);
      map.off('click', onMapClick);
      map.pm.disableDraw();
      // Remove it from the map, not just release geoman. StrictMode remounts effects in
      // development, and without this each pass leaves an orphan polygon that "start over" does
      // not clear.
      if (layerRef.current) {
        layerRef.current.pm.disable();
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
    // Mount and mode changes only. `boundary` is an INITIAL value on purpose: once mounted, the
    // source of truth is what the user draws, not the prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, draw]);

  // Read-only (dashboard map, farm modal): renders the polygon without geoman.
  useEffect(() => {
    if (draw) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (boundary && boundary.length >= 3) {
      const poly = L.polygon(boundary, { ...SHAPE_STYLE, interactive: false }).addTo(map);
      layerRef.current = poly;
    }
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, draw, boundary]);

  // Handle for the editor's buttons.
  useEffect(() => {
    if (!controllerRef) return;
    controllerRef.current = {
      undo: () => {
        // While drawing: drop the vertex just placed. The method is semi-private in geoman but
        // stable in 2.x; the try keeps a button from taking the view down if it changes.
        const drawer = polygonDrawer(map);
        if (drawer?.enabled?.() && drawer._removeLastVertex) {
          try {
            drawer._removeLastVertex();
            // geoman does not re-emit the ring when removing mid-draw, so it is read from the
            // working layer to keep the live area in step.
            if (workingRef.current) {
              onChangeRef.current?.(workingRing(workingRef.current), false);
            }
            return;
          } catch {
            /* cae al caso de abajo */
          }
        }
        // Already closed: drop the ring's last vertex, if more than three remain.
        const poly = layerRef.current;
        if (poly) {
          const ring = ringOf(poly);
          if (ring.length > 3) {
            const next = ring.slice(0, -1);
            poly.setLatLngs(next);
            onChangeRef.current?.(next, true);
          }
        }
      },
      clear: () => {
        map.pm.disableDraw();
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
          layerRef.current = null;
        }
        workingRef.current = null;
        onChangeRef.current?.([], false);
        if (drawRef.current) {
          // `pm:drawstart` re-attaches the vertex listener to the new working layer, so the
          // live area keeps working after starting over.
          map.pm.enableDraw('Polygon', { finishOn: 'dblclick' } as never);
        }
      },
      finish: () => {
        const drawer = polygonDrawer(map);
        if (!drawer?.enabled?.()) return;
        // Fewer than three vertices is not a polygon; finishing there yields an invalid shape.
        const pts = workingRef.current ? workingRing(workingRef.current) : [];
        if (pts.length < 3) return;
        try {
          drawer._finishShape?.();
        } catch {
          /* if the private method changes, the drawing simply stays open */
        }
      },
      hasShape: () => !!layerRef.current || !!polygonDrawer(map)?.enabled?.(),
    };
    return () => {
      if (controllerRef) controllerRef.current = null;
    };
  }, [map, controllerRef]);

  return null;
};
