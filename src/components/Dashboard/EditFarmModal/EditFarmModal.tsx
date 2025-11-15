import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, InputNumber, message } from 'antd';
import { X } from 'lucide-react';
import { Farm } from '../../../services/farms.service';
import { GooglePlacesAutocomplete } from '../../GooglePlacesAutocomplete';
import { useI18n } from '../../../contexts/I18nContext';
import './EditFarmModal.scss';

export interface EditFarmData {
  id: number;
  name: string;
  location: string;
  altitude: number;
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
        location: farm.location,
        altitude: farm.altitude
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
        location: values.location,
        altitude: values.altitude
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
              {t('farm.edit.button')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};