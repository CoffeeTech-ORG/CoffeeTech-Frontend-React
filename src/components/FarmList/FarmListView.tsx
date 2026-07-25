import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, SearchX, Sprout } from 'lucide-react';
import { App as AntdApp } from 'antd';
import { FarmRow } from './FarmRow';
import { FarmsMap } from './FarmsMap';
import { FarmToolbar, TierFilter } from './FarmToolbar';
import { StatusBanner } from './StatusBanner';
import { FarmRowsSkeleton } from '../ui/Skeletons';
import { AddFarmModal, AddFarmData } from '../Dashboard/AddFarmModal/AddFarmModal';
import { EditFarmModal, EditFarmData } from '../Dashboard/EditFarmModal/EditFarmModal';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { useFarms, Farm } from '../../hooks/useFarms';
import { useFarmOverview, FarmTier, FarmOverview } from '../../hooks/useFarmOverview';
import { farmsService } from '../../services/farms.service';
import { createFarm } from '../../services/farms.createFarm';
import './FarmListView.scss';

/**
 * Farm list -- the entry screen. Content only; `AppShell` provides the frame.
 *
 * Two columns: the WHOLE list on the left in urgency order, the map on the right, fixed while the
 * list scrolls. Farms are GROUPED by what they need -- with nine, a flat list means reading them
 * all to find which to attend.
 *
 * The list is not split across the columns. Splitting it (say, "to configure" on the right) makes
 * each column's height depend on how the data falls across tiers, which are unrelated counts: 1
 * against 8 today, 9 against 0 once the hubs are installed. Whole list on one side, only the map
 * on the other, and the heights stop depending on that split.
 *
 * Edit and delete are NOT here; they live on the farm screen, so the one irreversible action is
 * out of a list scrolled quickly. Only "Locate" stays: a farm with no coordinate is off the map,
 * and it should be fixable where that is noticed.
 */
export const FarmListView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { getFarms } = useFarms();
  const { message } = AntdApp.useApp();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [farmToEdit, setFarmToEdit] = useState<Farm | null>(null);
  const [filter, setFilter] = useState<TierFilter>('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const isManager = user?.role?.id === 1;
  const {
    overview,
    loading: overviewLoading,
    failed: overviewFailed,
  } = useFarmOverview(farms.map((f) => f.id));


  const load = useCallback(async () => {
    setLoadError(false);
    try {
      setFarms(await getFarms());
    } catch (error) {
      // A passing toast is not enough: without this the screen falls to the empty state, which
      // tells someone who has farms "you have none yet". To a farmer that does not read as a
      // technical error, and its remedy -- create the first -- makes duplicates.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [getFarms]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddSubmit = async (data: AddFarmData) => {
    if (!user) throw new Error('No user found');
    await createFarm(data, user.id);
    await load();
  };

  const handleEditSubmit = async (data: EditFarmData) => {
    await farmsService.updateFarm(data.id, {
      name: data.name,
      location: data.location,
      altitude: data.altitude,
      // Without this the coordinate is lost on every edit and the farm falls back to "unlocated".
      latitude: data.latitude,
      longitude: data.longitude,
      locationPrecision: data.locationPrecision,
      boundary: data.boundary,
    });
    await load();
    setFarmToEdit(null);
    message.success(t('farm.success.update'));
  };

  /** Greeting by time of day. The name comes from `username`, which is all there is. */
  const hora = new Date().getHours();
  const saludo = t(
    hora < 12 ? 'greeting.morning' : hora < 19 ? 'greeting.afternoon' : 'greeting.evening',
    { name: user?.username ?? '' }
  );

  // Date in the interface language, not the system's: the app already decides the language.
  const fechaDeHoy = new Date().toLocaleDateString(language === 'es' ? 'es-PE' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  /** Deliberate order: what needs action first, what is fine last. */
  const GRUPOS: FarmTier[] = ['crop', 'device', 'setup', 'ok'];

  /**
   * A farm's group, or `null` if its state could not be computed. NOT `?? 'ok'`: while
   * `useFarmOverview` is still fetching, that would group every farm under "up to date" and the
   * banner would announce in green that all is well -- a complete, false answer. `null` is what is
   * actually known at that moment.
   */
  const tierDe = useCallback(
    (f: Farm): FarmTier | null => {
      // Explicit type: without `noUncheckedIndexedAccess`, TypeScript assumes a keyed access
      // always hits and treats the fallback as dead code -- the case that really happens while
      // the state is in flight.
      const ov: FarmOverview | undefined = overview[f.id];
      return ov?.tier ?? null;
    },
    [overview]
  );

  /** Per-group counts over ALL farms: the filter chips do not filter themselves. */
  const counts = useMemo(
    () =>
      GRUPOS.reduce(
        (acc, tier) => ({ ...acc, [tier]: farms.filter((f) => tierDe(f) === tier).length }),
        {} as Record<FarmTier, number>
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [farms, tierDe]
  );

  const busqueda = query.trim().toLowerCase();

  const porGrupo = useMemo(() => {
    // Search by name IGNORES the group filter on purpose: typing "Cedros" while in "Need
    // attention" should still find it, or it would look nonexistent.
    const visibles = busqueda
      ? farms.filter((f) => f.name.toLowerCase().includes(busqueda))
      : filter === 'all'
        ? farms
        : farms.filter((f) => tierDe(f) === filter);

    const agrupadas = GRUPOS.map((tier) => ({
      tier: tier as FarmTier | null,
      fincas: visibles.filter((f) => tierDe(f) === tier),
    })).filter((g) => g.fincas.length > 0);

    // Farms left without a state (only if the computation failed) go last, in an unlabelled
    // group: listed, but not given a health that is not known.
    const sinEstado = visibles.filter((f) => tierDe(f) === null);
    return sinEstado.length > 0
      ? [...agrupadas, { tier: null, fincas: sinEstado }]
      : agrupadas;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farms, busqueda, filter, tierDe]);

  const hayResultados = porGrupo.length > 0;

  // With no located farm there is no map, only a two-line notice. The column must not stretch
  // to the whole viewport for it: every new account passes through this state, and it would leave
  // 800 px of fixed emptiness beside the list.
  const hayUbicadas = farms.some((f) => f.latitude != null && f.longitude != null);

  /**
   * Is there a state for EVERY farm in the list? Checks the data itself, not the loading flag:
   * between the farms arriving and the state effect starting there is a repaint where
   * `overviewLoading` is still `false`, and that one frame paints the screen -- green -- before
   * anything is known. Asking the data has no race to lose.
   */
  const estadoListo =
    overviewFailed || farms.length === 0 || farms.every((f) => overview[f.id] !== undefined);

  // The skeleton also waits for the STATE, not just the farms. With the list painted and the
  // state still in flight, this triage board has no triage, and the gap filled with "ok" claims
  // all is well. The answer shows whole or not at all.
  if (loading || overviewLoading || !estadoListo) {
    return (
      <div className="farm-list">
        <header className="farm-list__intro">
          <p className="farm-list__eyebrow">{fechaDeHoy} · {t('dashboard.summary')}</p>
          <div className="farm-list__heading">
            <h1 className="farm-list__title">{saludo}</h1>
          </div>
        </header>
        <FarmRowsSkeleton count={Math.min(Math.max(farms.length, 3), 6)} />
      </div>
    );
  }

  return (
    <div className="farm-list">
      <header className="farm-list__intro">
        <p className="farm-list__eyebrow">{fechaDeHoy} · {t('dashboard.summary')}</p>
        <div className="farm-list__heading">
          <h1 className="farm-list__title">{saludo}</h1>
          {isManager && (
            <button
              type="button"
              className="farm-list__add"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={18} aria-hidden="true" />
              <span>{t('sidebar.addFarm')}</span>
            </button>
          )}
        </div>
      </header>

      {loadError ? (
        // A connection error is NOT "you have no farms": saying so makes the farmer think their
        // work is gone and push toward duplicates.
        <div className="farm-list__empty is-error">
          <h2>{t('dashboard.error.title')}</h2>
          <p>{t('dashboard.error.body')}</p>
          <button type="button" className="farm-list__retry" onClick={load}>
            {t('dashboard.error.retry')}
          </button>
        </div>
      ) : farms.length === 0 ? (
        <div className="farm-list__empty">
          {/* Icono de lucide y no un emoji: el emoji lo dibuja el sistema operativo, así que
              cambia de estilo y de color según el dispositivo y no obedece al sistema visual. */}
          <div className="farm-list__empty-icon" aria-hidden="true">
            <Sprout size={40} strokeWidth={1.5} />
          </div>
          <h2>{t('dashboard.empty.title')}</h2>
          <p>{t('dashboard.empty.description')}</p>
        </div>
      ) : (
        <div className="farm-list__cols">
          {/* Fuera de `__main` para que la rejilla pueda reordenarlo: en móvil el mapa se
              intercala entre el aviso y los filtros, y desde dentro de otra columna no hay
              manera de interponerlo. */}
          {/* Sin estado no hay resumen que dar. El banner leía un `overview` vacío como cero
              problemas y anunciaba "todas tus fincas están bien": la peor frase posible cuando
              lo cierto es que no se pudo calcular. */}
          <div className="farm-list__banner">
            {overviewFailed ? (
              <p className="farm-list__state-error" role="status">
                {t('dashboard.state.unavailable')}
              </p>
            ) : (
              <StatusBanner overview={overview} total={farms.length} />
            )}
          </div>

          <div className="farm-list__main">
            <FarmToolbar
              counts={counts}
              total={farms.length}
              filter={filter}
              onFilter={setFilter}
              query={query}
              onQuery={setQuery}
              searchOpen={searchOpen}
              onSearchOpen={setSearchOpen}
            />

            {hayResultados ? (
              porGrupo.map(({ tier, fincas }) => (
                <section
                  key={tier ?? 'sin-estado'}
                  className={`farm-list__group is-${tier ?? 'unknown'}`}
                >
                  {/* Las fincas sin estado no llevan encabezado: no hay grupo al que
                      pertenezcan, y ponerles uno sería nombrar una salud que no se conoce. */}
                  {tier && (
                    <div className="farm-list__group-head">
                      <h2 className="farm-list__group-title">
                        {t(`farm.tier.${tier}`)}
                        <span className="farm-list__group-count">{fincas.length}</span>
                      </h2>
                      {/* Explica el grupo en una línea: sin esto, un título como "Por configurar"
                          no dice si es culpa de alguien ni qué hacer al respecto. */}
                      <p className="farm-list__group-hint">{t(`farm.tier.${tier}.hint`)}</p>
                    </div>
                  )}
                  <div className="farm-list__rows">
                    {fincas.map((farm) => (
                      <FarmRow
                        key={farm.id}
                        farm={farm}
                        overview={overview[farm.id]}
                        onOpen={(id) => navigate(`/fincas/${id}`)}
                        onLocate={(id) =>
                          setFarmToEdit(farms.find((f) => f.id === id) ?? null)
                        }
                        onHighlight={setHighlightedId}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              // Only reachable while searching: empty groups are not offered as filters.
              <div className="farm-list__no-match">
                <SearchX size={18} aria-hidden="true" />
                <p>{t('farm.search.noMatch', { q: query.trim() })}</p>
              </div>
            )}
          </div>

          <aside className={`farm-list__side${hayUbicadas ? '' : ' is-flat'}`}>
            <FarmsMap farms={farms} overview={overview} highlightedId={highlightedId} />
          </aside>
        </div>
      )}

      {addOpen && (
        <AddFarmModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      {/* Se montan sólo al abrirse, y con `key` por finca: así el formulario arranca limpio y
          `useForm` siempre tiene un `<Form>` al que conectarse. */}
      {farmToEdit && (
        <EditFarmModal
          key={farmToEdit.id}
          isOpen
          farm={farmToEdit}
          onClose={() => setFarmToEdit(null)}
          onSubmit={handleEditSubmit}
        />
      )}

    </div>
  );
};
