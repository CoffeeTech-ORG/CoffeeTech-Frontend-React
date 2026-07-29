import React, { useEffect, useState } from 'react';
import { Modal, Button, Input } from 'antd';
import { Trash2 } from 'lucide-react';
import { Farm } from '../../../services/farms.service';
import { useI18n } from '../../../contexts/I18nContext';
import './DeleteFarmModal.scss';

interface DeleteFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  farm: Farm | null;
}

/**
 * Delete a farm. Typing the name is required: what goes is not only the farm but its sections, its
 * readings and the recommendations the engine computed over them, with no undo or trash.
 *
 * No destructive action should be one tap from a routine one, and the setting makes it worse: in
 * the field, in full sun and sometimes gloved, an extra tap is easy. Typing the name forces reading
 * WHAT is being deleted before it can be deleted.
 */
export const DeleteFarmModal: React.FC<DeleteFarmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  farm,
}) => {
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);
  const [typed, setTyped] = useState('');

  // Opening for another farm the field must start empty, or it stays validated with the previous
  // name.
  useEffect(() => {
    if (isOpen) setTyped('');
  }, [isOpen, farm?.id]);

  const matches = farm != null && typed.trim() === farm.name.trim();

  const handleConfirm = async () => {
    if (!matches) return;
    try {
      setDeleting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting farm:', error);
      // The error is already surfaced by the parent component.
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!deleting) onClose();
  };

  if (!farm) return null;

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={500}
      className="delete-farm-modal"
      closable={!deleting}
    >
      <div className="delete-farm__head">
        <span className="delete-farm__icon" aria-hidden="true">
          <Trash2 size={20} />
        </span>
        <h2 className="delete-farm__title">{t('farm.delete.title')}</h2>
      </div>

      {/* Se nombra lo que se pierde. «Eliminará todos los datos asociados» no dice nada: el
          usuario no sabe qué cuenta como dato asociado. */}
      <p className="delete-farm__body">
        {t('farm.delete.lede.before')} <strong>«{farm.name}»</strong>{' '}
        {t('farm.delete.lede.after')}
      </p>

      <label className="delete-farm__confirm">
        <span className="delete-farm__label">{t('farm.delete.typeName')}</span>
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={farm.name}
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
          // Disabled, not hidden: the button is visible from the start, so typing the name reads
          // as what is missing and not a surprise requirement.
          disabled={!matches || deleting}
        >
          {t('farm.delete.button')}
        </Button>
      </div>
    </Modal>
  );
};
