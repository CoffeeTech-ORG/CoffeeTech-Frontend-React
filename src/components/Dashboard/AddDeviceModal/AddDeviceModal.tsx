import React, { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { X } from 'lucide-react';
import './AddDeviceModal.scss';

export interface AddDeviceData {
  deviceHubId: string;
}

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddDeviceData) => Promise<void>;
  loading?: boolean;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: AddDeviceData) => {
    try {
      setSubmitting(true);
      await onSubmit(values);
      form.resetFields();
      onClose();
      // Success message is handled by the parent component
    } catch (error: any) {
      console.error('Error adding device:', error);
      // Don't show generic error message here, let the parent component handle it
      // message.error('Failed to add device. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={500}
      className="add-device-modal"
      closable={false}
    >
      <div className="modal-header">
        <h2 className="modal-title">Add New Device</h2>
        <Button
          type="text"
          icon={<X size={20} />}
          onClick={handleCancel}
          className="close-btn"
        />
      </div>

      <div className="modal-content">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label="Device Hub MAC"
            name="deviceHubId"
            rules={[
              { required: true, message: 'Please enter the device hub MAC address' },
              { min: 2, message: 'Device hub MAC must be at least 2 characters' },
              { max: 100, message: 'Device hub MAC cannot exceed 100 characters' },
              {
                pattern: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
                message: 'Please enter a valid MAC address format (e.g., 1C:69:20:31:4B:78)'
              }
            ]}
          >
            <Input
              placeholder="Enter device hub MAC address (e.g., 1C:69:20:31:4B:78)"
              size="large"
              className="form-input"
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <div className="modal-actions">
            <Button
              type="default"
              size="large"
              onClick={handleCancel}
              disabled={submitting}
              className="cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={submitting}
              className="submit-btn"
            >
              Add Device
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};