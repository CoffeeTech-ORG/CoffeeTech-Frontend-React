import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { X, AlertTriangle } from 'lucide-react';
import { Section } from '../../../services/farms.service';
import './DeleteSectionModal.scss';

interface DeleteSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  section: Section | null;
}

export const DeleteSectionModal: React.FC<DeleteSectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  section
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting section:', error);
      // Error is already handled in the parent component
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!deleting) {
      onClose();
    }
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
      closable={false}
    >
      <div className="modal-header">
        <h2 className="modal-title">Delete Section</h2>
        <Button
          type="text"
          icon={<X size={20} />}
          onClick={handleCancel}
          className="close-btn"
          disabled={deleting}
        />
      </div>

      <div className="modal-content">
        <div className="warning-section">
          <div className="warning-icon">
            <AlertTriangle size={48} />
          </div>
          <div className="warning-text">
            <p className="warning-message">
              Are you sure you want to delete the section <strong>"{section.name}"</strong>?
            </p>
            <p className="warning-submessage">
              This action cannot be undone and will permanently remove all associated data and sensor readings.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <Button
            type="default"
            size="large"
            onClick={handleCancel}
            disabled={deleting}
            className="cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleConfirm}
            loading={deleting}
            className="delete-btn"
          >
            Delete Section
          </Button>
        </div>
      </div>
    </Modal>
  );
};