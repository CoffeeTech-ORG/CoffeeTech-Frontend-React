import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, message, Spin } from 'antd';
import { X } from 'lucide-react';
import { farmsService, Device } from '../../../services/farms.service';
import './AssignDeviceModal.scss';

const { Option } = Select;

export interface AssignDeviceData {
  deviceId: number;
}

interface AssignDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssignDeviceData) => Promise<void>;
  sectionId: string | null; // Used for reference, may be needed for future functionality
  sectionName: string | null;
  loading?: boolean;
}

export const AssignDeviceModal: React.FC<AssignDeviceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sectionId,
  sectionName
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    try {
      setLoadingDevices(true);
      const devicesData = await farmsService.getDevices();
      setDevices(devicesData);
    } catch (error) {
      console.error('Error loading devices:', error);
      message.error('Failed to load devices');
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSubmit = async (values: AssignDeviceData) => {
    try {
      setSubmitting(true);
      await onSubmit(values);
      form.resetFields();
      onClose();
    } catch (error: any) {
      console.error('Error assigning device:', error);
      // Error handling is done in parent component
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
      className="assign-device-modal"
      closable={false}
    >
      <div className="modal-header">
        <h2 className="modal-title">Assign Device to Section</h2>
        <Button
          type="text"
          icon={<X size={20} />}
          onClick={handleCancel}
          className="close-btn"
        />
      </div>

      <div className="modal-content">
        {sectionName && (
          <div className="section-info">
            <p><strong>Section:</strong> {sectionName}</p>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label="Select Device"
            name="deviceId"
            rules={[
              { required: true, message: 'Please select a device' }
            ]}
          >
            <Select
              placeholder="Select a device to assign"
              size="large"
              className="form-select"
              loading={loadingDevices}
              notFoundContent={loadingDevices ? <Spin size="small" /> : 'No devices available'}
            >
              {devices.map((device) => (
                <Option key={device.id} value={device.id}>
                  <div className="device-option">
                    <span className="device-mac">{device.deviceHubId}</span>
                    <span className="device-id">ID: {device.id}</span>
                  </div>
                </Option>
              ))}
            </Select>
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
              Assign Device
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};