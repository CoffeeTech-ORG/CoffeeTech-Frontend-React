import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { X } from 'lucide-react';
import { Farm } from '../../../services/farms.service';
import { useI18n } from '../../../contexts/I18nContext';
import './EditFarmModal.scss';

export interface EditFarmData {
  id: number;
  name: string;
  location: string;
}

interface EditFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditFarmData) => Promise<void>;
  farm: Farm | null;
  loading?: boolean;
}

export const EditFarmModal: React.FC<EditFarmModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  farm
}) => {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Set form values when farm data changes
  useEffect(() => {
    if (farm && isOpen) {
      form.setFieldsValue({
        name: farm.name,
        location: farm.location
      });
    }
  }, [farm, isOpen, form]);

  const handleSubmit = async (values: Omit<EditFarmData, 'id'>) => {
    if (!farm) return;
    
    try {
      setSubmitting(true);
      const farmId = parseInt(farm.id, 10);
      if (isNaN(farmId)) {
        throw new Error('Invalid farm ID');
      }
      
      await onSubmit({
        id: farmId,
        name: values.name,
        location: values.location
      });
      onClose();
    } catch (error) {
      console.error('Error updating farm:', error);
      message.error(t('farm.error.update'));
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
      className="edit-farm-modal"
      closable={false}
    >
      <div className="modal-header">
        <h2 className="modal-title">{t('farm.edit.title')}</h2>
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
            label={t('farm.name')}
            name="name"
            rules={[
              { required: true, message: t('farm.name.validation') },
              { min: 2, message: t('farm.name.length.min') },
              { max: 50, message: t('farm.name.length.max') }
            ]}
          >
            <Input
              placeholder={t('farm.name.placeholder')}
              size="large"
              className="form-input"
            />
          </Form.Item>

          <Form.Item
            label={t('farm.location')}
            name="location"
            rules={[
              { required: true, message: t('farm.location.validation') },
              { min: 2, message: t('farm.location.length.min') },
              { max: 100, message: t('farm.location.length.max') }
            ]}
          >
            <Input
              placeholder={t('farm.location.placeholder')}
              size="large"
              className="form-input"
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
              {t('farm.edit.button')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};