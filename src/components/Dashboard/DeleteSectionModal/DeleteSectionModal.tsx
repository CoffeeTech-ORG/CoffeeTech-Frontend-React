import React, { useEffect, useState } from 'react';
import { Modal, Button, Input } from 'antd';
import { Trash2 } from 'lucide-react';
import { Section } from '../../../services/farms.service';
import { useI18n } from '../../../contexts/I18nContext';
import './DeleteSectionModal.scss';

interface DeleteSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  section: Section | null;
}

/**
 * Delete a section. Same pattern as `DeleteFarmModal` and for the same reason: what goes is not
 * only the plot but its readings and the recommendations computed over them, with no undo. Typing
 * the name forces reading what is being deleted before it can be deleted.
 */
export const DeleteSectionModal: React.FC<DeleteSectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  section,
}) => {
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (isOpen) setTyped('');
  }, [isOpen, section?.id]);

  const matches = section != null && typed.trim() === section.name.trim();

  const handleConfirm = async () => {
    if (!matches) return;
    try {
      setDeleting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting section:', error);
      // The error is already surfaced by the parent component.
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!deleting) onClose();
  };

  if (!section) return null;

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={500}
      className="delete-section-modal"
      closable={!deleting}
    >
      <div className="delete-farm__head">
        <span className="delete-farm__icon" aria-hidden="true">
          <Trash2 size={20} />
        </span>
        <h2 className="delete-farm__title">{t('sections.delete.title')}</h2>
      </div>

      <p className="delete-farm__body">
        {t('sections.delete.lede.before')} <strong>«{section.name}»</strong>{' '}
        {t('sections.delete.lede.after')}
      </p>

      <label className="delete-farm__confirm">
        <span className="delete-farm__label">{t('sections.delete.typeName')}</span>
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={section.name}
          disabled={deleting}
          size="large"
          autoComplete="off"
          onPressEnter={handleConfirm}
        />
      </label>

      <div className="delete-farm__actions">
        <Button size="large" onClick={handleCancel} disabled={deleting}>
          {t('common.cancel')}
        </Button>
        <Button
          danger
          type="primary"
          size="large"
          onClick={handleConfirm}
          loading={deleting}
          disabled={!matches || deleting}
        >
          {t('sections.delete.button')}
        </Button>
      </div>
    </Modal>
  );
};
