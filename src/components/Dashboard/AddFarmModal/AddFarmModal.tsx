import React, { useState } from 'react';
import { Modal, Form, Input, Button, App } from 'antd';
import { X } from 'lucide-react';
import {
  FarmLocationPicker,
  FarmLocation,
  EMPTY_FARM_LOCATION
} from '../../../components/FarmLocationPicker/FarmLocationPicker';
import { LocationPrecision } from '../../../services/farms.service';
import {
  AltitudeField,
  COFFEE_ALTITUDE_MAX_M,
  COFFEE_ALTITUDE_MIN_M
} from '../../AltitudeField/AltitudeField';
import { useI18n } from '../../../contexts/I18nContext';
import './AddFarmModal.scss';

export interface AddFarmData {
  name: string;
  location: string;
  altitude: number | null;
  // Sent to the backend as-is: `createFarm` propagates the whole object.
  latitude: number | null;
  longitude: number | null;
  locationPrecision: LocationPrecision;
  // The boundary is `[lat, lng]`; `createFarm` converts it to GeoJSON before sending.
  boundary: [number, number][] | null;
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
  // The altitude is derived from the coordinate the grower just set, so the `location` field is
  // watched live and not only on submit.
  const ubicacion: FarmLocation | undefined = Form.useWatch('location', form);
  const [submitting, setSubmitting] = useState(false);
  const { message: messageApi } = App.useApp();

  const handleSubmit = async (values: { name: string; altitude?: number | null; location: FarmLocation }) => {
    try {
      setSubmitting(true);
      // The `location` field holds the whole object; it is flattened on send.
      await onSubmit({
        name: values.name,
        altitude: values.altitude ?? null,
        location: values.location.location,
        latitude: values.location.latitude,
        longitude: values.location.longitude,
        locationPrecision: values.location.locationPrecision,
        boundary: values.location.boundary
      });
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

          {/* El selector sustituye al autocompletado suelto. Antes, Google ya devolvía el
              `geometry` de cada lugar elegido y este modal lo tiraba: sólo se quedaba con el
              texto. De ahí que ninguna finca tuviera coordenadas y que el clima acabara
              mostrando la ciudad del teléfono. */}
          {/* El picker ES el control del campo: antd le inyecta `value` y `onChange`. Antes
              se le pasaban a mano y antd los pisaba, dejando `value` en `undefined`. */}
          <Form.Item
            label={t('farm.location')}
            name="location"
            initialValue={EMPTY_FARM_LOCATION}
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
              {t('farm.add.button')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
