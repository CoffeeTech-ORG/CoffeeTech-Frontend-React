import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { X, AlertTriangle } from 'lucide-react';
import { Farm } from '../../../services/farms.service';
import './DeleteFarmModal.scss';

interface DeleteFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  farm: Farm | null;
}

export const DeleteFarmModal: React.FC<DeleteFarmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  farm
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting farm:', error);
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

  if (!farm) return null;

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={500}
      className="delete-farm-modal"
      closable={false}
    >
      <div className="modal-header">
        <h2 className="modal-title">Delete Farm</h2>
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
              Are you sure you want to delete the farm <strong>"{farm.name}"</strong>?
            </p>
            <p className="warning-submessage">
              This action cannot be undone and will permanently remove all associated data.
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
            Delete Farm
          </Button>
        </div>
      </div>
    </Modal>
  );
};