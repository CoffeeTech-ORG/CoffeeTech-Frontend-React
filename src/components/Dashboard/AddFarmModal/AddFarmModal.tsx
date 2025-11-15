import React, { useState } from 'react';
import { Modal, Form, Input, Button, InputNumber, App } from 'antd';
import { X } from 'lucide-react';
import { GooglePlacesAutocomplete } from '../../../components/GooglePlacesAutocomplete';
import { useI18n } from '../../../contexts/I18nContext';
import './AddFarmModal.scss';

export interface AddFarmData {
  name: string;
  location: string;
  altitude: number;
}

interface AddFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddFarmData) => Promise<void>;
  loading?: boolean;
}

export const AddFarmModal: React.FC<AddFarmModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { message: messageApi } = App.useApp();

  const handleSubmit = async (values: AddFarmData) => {
    try {
      setSubmitting(true);
      await onSubmit(values);
      form.resetFields();
      onClose();
      messageApi.success(t('farm.success.create'));
    } catch (error) {
      console.error('Error adding farm:', error);
      messageApi.error(t('farm.error.create'));
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
      className="add-farm-modal"
      closable={false}
    >
      <div className="modal-header">
        <h2 className="modal-title">{t('farm.add.title')}</h2>
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
            <GooglePlacesAutocomplete
              placeholder={t('farm.location.placeholder')}
              size="large"
              className="form-input"
              onPlaceSelect={(place) => {
                if (place.formatted_address) {
                  form.setFieldValue('location', place.formatted_address);
                  form.validateFields(['location']);
                }
              }}
              onChange={(value) => {
                // Only update if it's different from current value to avoid loops
                if (form.getFieldValue('location') !== value) {
                  form.setFieldValue('location', value);
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label={t('farm.altitude')}
            name="altitude"
            rules={[
              { required: true, message: t('farm.altitude.validation') },
              { type: 'number', min: 0, message: t('farm.altitude.positive') },
              { type: 'number', max: 10000, message: t('farm.altitude.max') }
            ]}
            help={t('farm.altitude.range') || 'Mínimo: 0 m - Máximo: 10000 m'}
          >
            <InputNumber
              placeholder={t('farm.altitude.placeholder')}
              size="large"
              className="form-input"
              step={1}
              min={0}
              max={10000}
              precision={0}
              style={{ width: '100%' }}
              controls={false}
              maxLength={5}
              parser={(value) => {
                // Solo permitir números y limitar a 5 caracteres
                const parsed = value?.replace(/[^\d]/g, '').slice(0, 5) || '';
                const numValue = parsed ? Number(parsed) : 0;
                // Si el valor excede 10000, devolver el valor anterior (no actualizar)
                if (numValue > 10000) {
                  return form.getFieldValue('altitude') || 0;
                }
                return numValue || '' as any;
              }}
              onKeyPress={(e) => {
                // Bloquear cualquier tecla que no sea número
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
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
              {t('farm.add.button')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
