import React, { useRef, useState } from 'react';
import { Undo2, Trash2, X, Check, CheckCheck } from 'lucide-react';
import { MapView } from '../MapView/MapView';
import { BoundaryController, LatLng } from '../MapView/BoundaryLayer';
import { formatArea, polygonAreaHa } from '../../utils/geoArea';
import { useI18n } from '../../contexts/I18nContext';
import './FarmBoundaryEditor.scss';

interface FarmBoundaryEditorProps {
  /** Starting centre: the farm's already-saved coordinate. */
  latitude: number;
  longitude: number;
  /** Prior boundary, when editing a farm that already has one. */
  initial?: LatLng[] | null;
  onSave: (ring: LatLng[], areaHa: number) => void;
  onClose: () => void;
}

/**
 * Dedicated surface for drawing a farm's boundary.
 *
 * The location picker's map is only big enough to place ONE point. Placing vertices precisely there
 * is awkward on desktop and bad on a phone, which is the real case: the farmer draws the plot's edge
 * with a finger. So the boundary opens its own surface -- full screen on mobile, a wide panel on
 * desktop -- with the satellite large, the controls as touch buttons and the area in hectares live.
 *
 * The area is the immediate reward and, along the way, an error detector: "40 ha" on a two-hectare
 * plot means the trace is wrong and it shows at once. It is also the figure the engine needed to
 * turn "you have X kg/ha left" into the concrete amount to buy.
 */
export const FarmBoundaryEditor: React.FC<FarmBoundaryEditorProps> = ({
  latitude,
  longitude,
  initial,
  onSave,
  onClose,
}) => {
  const { t } = useI18n();
  const [ring, setRing] = useState<LatLng[]>(initial ?? []);
  // `true` while the polygon is not yet closed: once closed, `pm:create` no longer reports loose
  // vertices, so the "Finish" button only makes sense before that.
  const [closed, setClosed] = useState<boolean>(!!(initial && initial.length >= 3));
  const controllerRef = useRef<BoundaryController | null>(null);

  const enough = ring.length >= 3;

  return (
    <div className="boundary-editor" role="dialog" aria-modal="true" aria-label={t('boundary.title')}>
      <div className="boundary-editor__panel">
        <header className="boundary-editor__head">
          <div>
            <h2 className="boundary-editor__title">{t('boundary.title')}</h2>
            <p className="boundary-editor__hint">{t('boundary.hint')}</p>
          </div>
          <button
            type="button"
            className="boundary-editor__close"
            onClick={onClose}
            aria-label={t('boundary.cancel')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="boundary-editor__map">
          <MapView
            latitude={latitude}
            longitude={longitude}
            zoom={16}
            initialLayer="satellite"
            drawBoundary
            boundary={initial ?? null}
            onBoundaryChange={(r, isClosed) => {
              setRing(r);
              setClosed(isClosed);
            }}
            boundaryController={controllerRef}
            height="100%"
          />
        </div>

        <footer className="boundary-editor__foot">
          <div className="boundary-editor__area">
            <span className="boundary-editor__area-label">{t('boundary.area')}</span>
            {/* Mientras no hay tres vértices no hay polígono, así que no hay superficie: se
                dice qué falta en vez de mostrar un «0 ha» que parecería un dato. */}
            <span className="boundary-editor__area-value">
              {enough ? formatArea(ring) : t('boundary.area.pending')}
            </span>
          </div>

          <div className="boundary-editor__tools">
            <button
              type="button"
              className="boundary-editor__tool"
              onClick={() => controllerRef.current?.undo()}
              disabled={ring.length === 0}
            >
              <Undo2 size={17} aria-hidden="true" />
              {t('boundary.undo')}
            </button>
            <button
              type="button"
              className="boundary-editor__tool"
              onClick={() => {
                controllerRef.current?.clear();
                setRing([]);
                setClosed(false);
              }}
              disabled={ring.length === 0}
            >
              <Trash2 size={17} aria-hidden="true" />
              {t('boundary.reset')}
            </button>
            {/* Cierra el polígono de forma fiable: es la alternativa al doble clic, que en
                táctil no cierra bien. Visible mientras se dibuja; `finish()` sólo cierra si ya
                hay tres esquinas, así que pulsarlo antes no rompe nada. */}
            {!closed && (
              <button
                type="button"
                className="boundary-editor__tool is-finish"
                onClick={() => controllerRef.current?.finish()}
                disabled={ring.length < 3}
              >
                <CheckCheck size={17} aria-hidden="true" />
                {t('boundary.finish')}
              </button>
            )}
          </div>

          <div className="boundary-editor__actions">
            <button type="button" className="boundary-editor__btn is-ghost" onClick={onClose}>
              {t('boundary.cancel')}
            </button>
            <button
              type="button"
              className="boundary-editor__btn is-primary"
              onClick={() => onSave(ring, polygonAreaHa(ring))}
              // Saving only with the boundary CLOSED. While drawing, "Finish" rules, so the two
              // buttons never appear active at once -- which was what made "Finish" and "Save" look
              // like the same thing.
              disabled={!closed || !enough}
            >
              <Check size={17} aria-hidden="true" />
              {t('boundary.save')}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
