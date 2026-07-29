import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { X } from 'lucide-react';
import { Farm } from '../../../services/farms.service';
import {
  FarmLocationPicker,
  FarmLocation
} from '../../FarmLocationPicker/FarmLocationPicker';
import { LocationPrecision } from '../../../services/farms.service';
import {
  AltitudeField,
  COFFEE_ALTITUDE_MAX_M,
  COFFEE_ALTITUDE_MIN_M
} from '../../AltitudeField/AltitudeField';
import { useI18n } from '../../../contexts/I18nContext';
import './EditFarmModal.scss';

export interface EditFarmData {
  id: number;
  name: string;
  location: string;
  altitude: number | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: LocationPrecision;
  boundary: [number, number][] | null;
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
  // The altitude is derived from the coordinate the grower just set, so the `location` field is
  // watched live and not only on submit.
  const ubicacion: FarmLocation | undefined = Form.useWatch('location', form);
  const [submitting, setSubmitting] = useState(false);

  // Set form values when farm data changes
  useEffect(() => {
    if (farm && isOpen) {
      form.setFieldsValue({
        name: farm.name,
        altitude: farm.altitude,
        // One field with everything: reopening, the map appears where it was rather than blank as
        // if the farm had never been located.
        location: {
          location: farm.location,
          latitude: farm.latitude ?? null,
          longitude: farm.longitude ?? null,
          locationPrecision: farm.locationPrecision ?? 'NONE',
          boundary: farm.boundary ?? null
        }
      });
    }
  }, [farm, isOpen, form]);

  const handleSubmit = async (values: {
    name: string;
    altitude?: number | null;
    location: FarmLocation;
  }) => {
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
        altitude: values.altitude ?? null,
        location: values.location.location,
        latitude: values.location.latitude,
        longitude: values.location.longitude,
        locationPrecision: values.location.locationPrecision,
        boundary: values.location.boundary
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

          {/* El picker ES el control del campo; antd le inyecta `value` y `onChange`. */}
          <Form.Item
            label={t('farm.location')}
            name="location"
            rules={[
              {
                validator: (_, v: FarmLocation) =>
                  v?.location?.trim()
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('farm.location.validation')))
              }
            ]}
          >
            <FarmLocationPicker />
          </Form.Item>

          {/* Ya no es obligatorio, y ya no se teclea a ciegas: en cuanto hay coordenadas se
              rellena del modelo de elevación de 90 m —el mismo que usa el motor para corregir la
              temperatura— y avisa si lo declarado y lo del mapa no parecen el mismo punto. Así se
              tecleó 1450 en el piloto cuando el hub está a 1823, y esa cifra decide la banda
              altitudinal, que cambia el peso de cuatro reglas de plaga y enfermedad.
              Vacío es una respuesta válida: el backend guarda nulo y el motor no modula. */}
          <Form.Item
            label={t('farm.altitude')}
            name="altitude"
            rules={[
              {
                type: 'number',
                min: COFFEE_ALTITUDE_MIN_M,
                max: COFFEE_ALTITUDE_MAX_M,
                message: t('farm.altitude.range', {
                  min: COFFEE_ALTITUDE_MIN_M,
                  max: COFFEE_ALTITUDE_MAX_M
                })
              }
            ]}
          >
            <AltitudeField
              latitude={ubicacion?.latitude ?? null}
              longitude={ubicacion?.longitude ?? null}
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