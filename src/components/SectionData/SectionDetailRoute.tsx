import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import { SectionDetailView } from '../SectionDetailView';
import { SectionDetailSkeleton } from '../ui/Skeletons';
import { NotFound } from '../AppShell/NotFound';
import { EditSectionModal, EditSectionData } from '../Dashboard/EditSectionModal/EditSectionModal';
import { DeleteSectionModal } from '../Dashboard/DeleteSectionModal/DeleteSectionModal';
import { useFarms, Section } from '../../hooks/useFarms';
import { farmsService } from '../../services/farms.service';
import { useI18n } from '../../contexts/I18nContext';

/**
 * Resolves the section from `:farmId/:sectionId` and hands it to `SectionDetailView`. Same reason
 * as `FarmSectionsView`: the screen must rebuild from the URL alone, so a direct link and F5 work.
 *
 * Editing and deleting the section also live here rather than as two icons per list card, where a
 * delete per card is an accident waiting to happen; in the detail the user is already looking at
 * that plot. The edit modal is also where the hub is assigned or removed, so the "no hub" state
 * opens this same dialog instead of sending the user back to the list.
 */
export const SectionDetailRoute: React.FC = () => {
  const { farmId, sectionId } = useParams<{ farmId: string; sectionId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { message } = AntdApp.useApp();
  const { getFarmSections } = useFarms();
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!farmId || !sectionId) {
      setLoading(false);
      return;
    }
    try {
      const sections = await getFarmSections(farmId);
      setSection(sections.find((s) => s.id === sectionId) ?? null);
    } catch {
      setSection(null);
    } finally {
      setLoading(false);
    }
  }, [farmId, sectionId, getFarmSections]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEditSubmit = async (data: EditSectionData) => {
    await farmsService.updateSection(data.id, { name: data.name, type: data.type });
    await load();
    setEditOpen(false);
    message.success(t('sections.success.update'));
  };

  const handleDeleteConfirm = async () => {
    const id = parseInt(String(sectionId), 10);
    if (Number.isNaN(id)) throw new Error('Invalid section ID');
    try {
      await farmsService.deleteSection(id);
      message.success(t('sections.success.delete'));
      // Staying on the detail of something that no longer exists makes no sense; returning to the
      // farm confirms the delete.
      navigate(`/fincas/${farmId}`);
    } catch (error) {
      message.error(t('sections.error.delete'));
      throw error;
    }
  };

  // The same skeleton the view uses while resolving its data: a spinner here would show two
  // waiting languages in a row -- spinner then skeleton -- for one navigation.
  if (loading) return <SectionDetailSkeleton />;

  if (!section) return <NotFound kind="section" />;

  return (
    <>
      <SectionDetailView
        section={section}
        onBack={() => navigate(`/fincas/${farmId}`)}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        // The hub is managed inside the edit modal: it is an attribute of the plot, like its name
        // and stage.
        onAssignHub={() => setEditOpen(true)}
      />

      {editOpen && (
        <EditSectionModal
          isOpen
          section={section}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deleteOpen && (
        <DeleteSectionModal
          isOpen
          section={section}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
};
