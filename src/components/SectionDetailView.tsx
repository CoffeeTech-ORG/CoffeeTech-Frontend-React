import React from 'react';
import { Button } from 'antd';
import { ArrowLeft } from 'lucide-react';
import SectionData from './SectionData/SectionData';
import { Section } from '../types/api.types';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

interface SectionDetailViewProps {
  section: Section;
  onBack: () => void;
  /** Assign or remove the hub. Opens the same dialog as edit: the hub is one more attribute. */
  onAssignHub?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * A section's detail.
 *
 * The frame (top bar, language, session) comes from `AppShell`. Otherwise this view carries its own
 * copy of the header and side rail -- the third of three implementations of the same component.
 */
export const SectionDetailView: React.FC<SectionDetailViewProps> = ({
  section,
  onBack,
  onAssignHub,
  onEdit,
  onDelete,
}) => {
  const { token } = useAuth();
  const { t } = useI18n();

  return (
    <div className="section-detail">
      <div className="section-detail__header" style={{ marginBottom: '12px' }}>
        <Button
          type="text"
          icon={<ArrowLeft size={20} />}
          onClick={onBack}
          className="back-btn"
        >
          {t('nav.backTo', { destination: t('sections.title') })}
        </Button>
      </div>

      <SectionData
        authToken={token ?? null}
        section={section}
        onAssignHub={onAssignHub}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};

export default SectionDetailView;
