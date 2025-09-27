import React, { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { X } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';
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
  const { t } = useI18n();
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
        <h2 className="modal-title">{t('device.add')}</h2>
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
            label={t('device.mac')}
            name="deviceHubId"
            rules={[
              { required: true, message: t('device.mac.validation') },
              { min: 2, message: t('device.mac.length.min') },
              { max: 100, message: t('device.mac.length.max') },
              {
                pattern: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
                message: t('device.mac.format')
              }
            ]}
          >
            <Input
              placeholder={t('device.mac.placeholder')}
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
              {t('common.cancel')}
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={submitting}
              className="submit-btn"
            >
              {t('device.add')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};