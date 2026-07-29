import React, { useState, useEffect } from 'react';
import { Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { ArrowLeft, Map, MapPin, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { SectionCard, SectionCoverage } from '../SectionCard/SectionCard';
import { SectionCardsSkeleton } from '../../ui/Skeletons';
import { STATUS_TOKENS } from '../../../styles/statusTokens';
import { AddSectionModal, AddSectionData } from '../AddSectionModal/AddSectionModal';
import { EditFarmModal, EditFarmData } from '../EditFarmModal/EditFarmModal';
import { DeleteFarmModal } from '../DeleteFarmModal/DeleteFarmModal';
import { FarmMapModal } from '../FarmMapModal/FarmMapModal';
import { FarmWeatherChip } from '../../FarmList/FarmWeatherChip';
import { useFarms, Farm, Section } from '../../../hooks/useFarms';
import { farmsService } from '../../../services/farms.service';
import { useAuth } from '../../../contexts/AuthContext';
import { useI18n } from '../../../contexts/I18nContext';
import { useSectionCoverage } from '../../../hooks/useSectionCoverage';
import './FarmSections.scss';

interface FarmSectionsProps {
  farm: Farm;
  onBack: () => void;
  onSectionSelect?: (section: Section) => void;
  /** After editing or deleting the farm, refresh or leave; the mounter decides. */
  onFarmChanged?: () => void;
  onFarmDeleted?: () => void;
}

export const FarmSections: React.FC<FarmSectionsProps> = ({
  farm,
  onBack,
  onSectionSelect,
  onFarmChanged,
  onFarmDeleted,
}) => {
  // Editing and deleting the farm are handled HERE, not in the panel. In a list scrolled quickly,
  // a delete button per row is an accident waiting to happen; here the user is already looking at
  // this one farm.
  const [farmEditOpen, setFarmEditOpen] = useState(false);
  const [farmDeleteOpen, setFarmDeleteOpen] = useState(false);
  const [farmMapOpen, setFarmMapOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [addingSectionLoading, setAddingSectionLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useI18n();
  const { getFarmSections, createSection } = useFarms();
  const isAdmin = user?.role?.id === 1;
  // A single /devices query for the whole list; see the hook.
  const { coverage, loading: coverageLoading } = useSectionCoverage(sections.map((sec) => sec.id));

  useEffect(() => {
    loadFarmSections();
  }, [farm.id]);

  const loadFarmSections = async () => {
    try {
      setLoading(true);
      const sectionsData = await getFarmSections(farm.id);
      setSections(sectionsData);
    } catch (error) {
      console.error('Error loading farm sections:', error);
      message.error(t('sections.error.create'));
    } finally {
      setLoading(false);
    }
  };

  const handleSectionDetails = (sectionId: string) => {
    const found = sections.find(s => String(s.id) === String(sectionId)) ?? null;
    if (found && onSectionSelect) {
      onSectionSelect(found);
    } else {
      message.info(`View section details for ${sectionId}`);
    }
  };

  // Edit, delete and assign-hub are not here: they live in the section detail, where the user is
  // already looking at that one plot. This screen is triage, read-only.

  const handleAddSection = () => {
    setIsAddSectionModalOpen(true);
  };

  const handleCloseAddSectionModal = () => {
    setIsAddSectionModalOpen(false);
  };

  const handleSubmitAddSection = async (data: AddSectionData) => {
    try {
      setAddingSectionLoading(true);
      const created = await createSection(farm.id, data);

      // If a hub was chosen, link it in the same step. AFTER creating the section, because the
      // assignment needs its id; if this fails the section is still created and can be assigned
      // from the "no hub" chip.
      if (data.deviceId && created?.id) {
        try {
          await farmsService.createAssignment(Number(created.id), data.deviceId);
        } catch (assignError) {
          console.error('La sección se creó pero el hub no se pudo enlazar:', assignError);
          message.warning(t('sections.hub.assignAfterCreateFailed'));
        }
      }

      await loadFarmSections(); // Reload sections to show the new one
    } catch (error) {
      console.error('Error creating section:', error);
      throw error; // Re-throw to let the modal handle the error message
    } finally {
      setAddingSectionLoading(false);
    }
  };

  // No manual hub registration: a hub enters the inventory on its first reading, and typing the
  // MAC by hand was the last vector for duplicates.

  const handleFarmEditSubmit = async (data: EditFarmData) => {
    await farmsService.updateFarm(data.id, {
      name: data.name,
      location: data.location,
      altitude: data.altitude,
      latitude: data.latitude,
      longitude: data.longitude,
      locationPrecision: data.locationPrecision,
      boundary: data.boundary,
    });
    setFarmEditOpen(false);
    message.success(t('farm.success.update'));
    onFarmChanged?.();
  };

  const handleFarmDeleteConfirm = async () => {
    const id = parseInt(farm.id, 10);
    if (Number.isNaN(id)) throw new Error('Invalid farm ID');
    try {
      await farmsService.deleteFarm(id);
      message.success(t('farm.success.delete'));
      // Leave the screen: staying on the detail of something that no longer exists makes no
      // sense, and returning to the panel confirms the delete.
      (onFarmDeleted ?? onBack)();
    } catch (error) {
      message.error(t('farm.error.delete'));
      throw error;
    }
  };




  const unlocated = farm.latitude == null || farm.longitude == null;

  // Farm coverage summary, on the same axis 2 as each card's chips.
  const counts = Object.values(coverage).reduce(
    (acc, c) => {
      acc[c.kind] += 1;
      return acc;
    },
    { reporting: 0, stale: 0, 'no-hub': 0 } as Record<SectionCoverage['kind'], number>
  );

  const summaryChips = [
    { key: 'reporting', n: counts.reporting, token: STATUS_TOKENS.ok, label: 'sections.summary.reporting' },
    { key: 'stale', n: counts.stale, token: STATUS_TOKENS.warning, label: 'sections.summary.stale' },
    { key: 'no-hub', n: counts['no-hub'], token: STATUS_TOKENS.neutral, label: 'sections.summary.noHub' },
  ]
    .filter((c) => c.n > 0)
    .map((c) => ({ ...c, text: t(c.label, { n: c.n }) }));

  // The three FARM actions in one menu. Loose, they are three icons competing with the content,
  // and with the two each card repeats the screen would offer five icon buttons for a view whose
  // job is to say which plot to look at.
  const farmMenu: MenuProps['items'] = [
    {
      key: 'map',
      icon: <Map size={15} />,
      label: t('farm.viewMap'),
      onClick: () => setFarmMapOpen(true),
    },
    ...(isAdmin
      ? [
          {
            key: 'edit',
            icon: <Pencil size={15} />,
            label: t('farm.edit'),
            onClick: () => setFarmEditOpen(true),
          },
          { type: 'divider' as const },
          {
            key: 'delete',
            icon: <Trash2 size={15} />,
            label: t('farm.delete'),
            danger: true,
            onClick: () => setFarmDeleteOpen(true),
          },
        ]
      : []),
  ];

  // The frame (top bar, language, session) comes from `AppShell`; this view carries no copy of
  // its own.
  return (
          <div className="farm-sections">
            <header className="farm-sections__hero">
              <div className="farm-sections__hero-top">
                <button type="button" className="farm-sections__back" onClick={onBack}>
                  <ArrowLeft size={17} aria-hidden="true" />
                  {t('nav.dashboard')}
                </button>

                <Dropdown menu={{ items: farmMenu }} trigger={['click']} placement="bottomRight">
                  <button
                    type="button"
                    className="farm-sections__menu"
                    title={t('farm.actions')}
                    aria-label={t('farm.actions')}
                  >
                    <MoreVertical size={18} />
                  </button>
                </Dropdown>
              </div>

              <div className="farm-sections__hero-row">
                <div className="farm-sections__farm">
                  <h1 className="farm-sections__farm-name">{farm.name}</h1>
                  <p className="farm-sections__farm-meta">
                    <MapPin size={13} aria-hidden="true" />
                    {[
                      farm.location,
                      farm.altitude ? `${Math.round(farm.altitude)} m` : null,
                      sections.length
                        ? sections.length === 1
                          ? t('farm.meta.sections.one')
                          : t('farm.meta.sections', { n: sections.length })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {/* Sin coordenada no hay clima que dar: en vez de un hueco, la salida. */}
                {unlocated ? null : <FarmWeatherChip farm={farm} variant="hero" />}
              </div>

              {unlocated && isAdmin && (
                <button
                  type="button"
                  className="farm-sections__locate"
                  onClick={() => setFarmEditOpen(true)}
                >
                  <MapPin size={13} aria-hidden="true" />
                  {t('farm.location.missingWeather')}
                </button>
              )}
            </header>

            {/* Tira de resumen: amortigua el salto del verde al crema y devuelve al plano del
                contenido el estado de la finca. Sólo aparecen los estados que existen — un
                "0 sin sensor" es ruido, no información. */}
            {summaryChips.length > 0 && (
              <div className="farm-sections__summary">
                {summaryChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="farm-sections__summary-chip"
                    style={{
                      color: chip.token.fg,
                      background: chip.token.bg,
                      borderColor: chip.token.border,
                    }}
                  >
                    <i aria-hidden="true" />
                    {chip.text}
                  </span>
                ))}
              </div>
            )}

            <div className="farm-sections__content">
              <div className="sections-heading">
                <h2 className="sections-title">
                  {t('sections.title')} <span className="sections-count">· {sections.length}</span>
                </h2>
                {isAdmin && (
                  <button
                    type="button"
                    className="farm-sections__add"
                    onClick={handleAddSection}
                    title={t('sections.add')}
                  >
                    <Plus size={16} aria-hidden="true" />
                    <span className="farm-sections__add-label">{t('sections.add')}</span>
                  </button>
                )}
              </div>

              {loading || coverageLoading ? (
                // The skeleton also waits for coverage: without it the cards appear with no chip
                // or verdict and fill in as the user watches.
                <SectionCardsSkeleton count={Math.max(sections.length, 2)} />
              ) : sections.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__content">
                    <img
                      src="/assets/section_icons/nosectionsfound1.png"
                      alt="No sections found"
                      className="empty-state__image"
                    />
                    <h3>{t('sections.empty.title')}</h3>
                    <p>{t('sections.empty.description')}</p>
                  </div>
                </div>
              ) : (
                <div className="sections-grid">
                  {sections.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      coverage={coverage[section.id]}
                      onViewDetails={handleSectionDetails}
                    />
                  ))}
                </div>
              )}
            </div>

      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={handleCloseAddSectionModal}
        onSubmit={handleSubmitAddSection}
        loading={addingSectionLoading}
        farmId={farm.id}
      />



      {farmEditOpen && (
        <EditFarmModal
          isOpen
          farm={farm}
          onClose={() => setFarmEditOpen(false)}
          onSubmit={handleFarmEditSubmit}
        />
      )}

      {farmDeleteOpen && (
        <DeleteFarmModal
          isOpen
          farm={farm}
          onClose={() => setFarmDeleteOpen(false)}
          onConfirm={handleFarmDeleteConfirm}
        />
      )}

      {farmMapOpen && (
        <FarmMapModal
          isOpen
          onClose={() => setFarmMapOpen(false)}
          farmName={farm.name}
          location={farm.location}
          latitude={farm.latitude}
          longitude={farm.longitude}
          locationPrecision={farm.locationPrecision}
          boundary={farm.boundary}
        />
      )}
    </div>
  );
};