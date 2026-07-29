import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { X } from 'lucide-react';
import { Section, farmsService } from '../../../services/farms.service';
import { sensorService } from '../../../services/sensor.service';
import { Sensor } from '../../../types/sensor.types';
import { useI18n } from '../../../contexts/I18nContext';
import { GROWTH_STAGES, stageImage } from '../../../utils/growthStage';
import './EditSectionModal.scss';

const { Option } = Select;

export interface EditSectionData {
  id: number;
  name: string;
  type: string;
}

interface EditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditSectionData) => Promise<void>;
  section: Section | null;
  loading?: boolean;
}

export const EditSectionModal: React.FC<EditSectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  section
}) => {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  /**
   * The hub measuring this section is managed here, not in a separate card button. To the user the
   * hub is an ATTRIBUTE of the plot -- "what equipment measures it?" -- like its name and stage; a
   * separate icon would split the same task across two places.
   */
  const [hubs, setHubs] = useState<Sensor[]>([]);
  const [hubsLoading, setHubsLoading] = useState(false);
  const [pendingHubId, setPendingHubId] = useState<number | null>(null);

  const currentHub = section
    ? hubs.find((h) => String(h.sectionId) === String(section.id))
    : undefined;

  // Only UNASSIGNED hubs are offered: one already installed in another plot would leave that one
  // without data, and that must not happen by accident from a dropdown.
  const availableHubs = hubs.filter((h) => h.sectionId == null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setHubsLoading(true);
    setPendingHubId(null);
    sensorService
      .getAllSensors()
      .then((list) => !cancelled && setHubs(list))
      .catch(() => !cancelled && setHubs([]))
      .finally(() => !cancelled && setHubsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleRemoveHub = async () => {
    if (!currentHub?.assignmentId) return;
    try {
      setSubmitting(true);
      await farmsService.removeAssignment(currentHub.assignmentId);
      message.success(t('sections.hub.removed'));
      setHubs((prev) =>
        prev.map((h) =>
          h.id === currentHub.id ? { ...h, sectionId: null, assignmentId: null } : h
        )
      );
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignHub = async () => {
    if (!section || pendingHubId == null) return;
    try {
      setSubmitting(true);
      await farmsService.createAssignment(Number(section.id), pendingHubId);
      message.success(t('sections.hub.assigned'));
      setHubs((prev) =>
        prev.map((h) => (h.id === pendingHubId ? { ...h, sectionId: Number(section.id) } : h))
      );
      setPendingHubId(null);
    } catch (error: any) {
      message.error(error.message || t('sections.hub.assignError'));
    } finally {
      setSubmitting(false);
    }
  };

  // The project images, not emoji: the same seen on entering the section.
  const growthStageOptions = GROWTH_STAGES.map((key) => ({
    value: key,
    label: t(`sectionType.${key}`),
    image: stageImage(key),
  }));

  // Helper function to convert display name to internal value
  const getValueFromDisplayName = (displayName: string) => {
    const displayNameToValue: Record<string, string> = {
      'Plántula': 'plantula',
      'Vegetativo': 'vegetativo',
      'Floración': 'floracion',
      'Fructificación': 'fructificacion',
      'Maduración': 'maduracion',
      'Cosecha': 'cosecha'
    };
    return displayNameToValue[displayName] || displayName.toLowerCase();
  };

  // Helper function to convert internal value to display name
  const getDisplayNameFromValue = (value: string) => {
    const option = growthStageOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Set form values when section data changes
  useEffect(() => {
    if (section && isOpen) {
      const growthStageValue = getValueFromDisplayName(section.type);
      form.setFieldsValue({
        name: section.name,
        type: growthStageValue
      });
    }
  }, [section, isOpen, form]);

  const handleSubmit = async (values: Omit<EditSectionData, 'id'>) => {
    if (!section) return;
    
    try {
      setSubmitting(true);
      const sectionId = parseInt(section.id, 10);
      if (isNaN(sectionId)) {
        throw new Error('Invalid section ID');
      }

      // Convert the internal value back to display name for the API
      const displayName = getDisplayNameFromValue(values.type);
      
      await onSubmit({
        id: sectionId,
        name: values.name,
        type: displayName
      });
      onClose();
    } catch (error) {
      console.error('Error updating section:', error);
      message.error(t('sections.error.update'));
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
      className="edit-section-modal"
      closable={false}
    >
      <div className="modal-header">
        <h2 className="modal-title">{t('sections.edit')}</h2>
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
            label={t('sections.name')}
            name="name"
            rules={[
              { required: true, message: t('sections.name.validation') },
              { min: 2, message: t('sections.name.length.min') },
              { max: 50, message: t('sections.name.length.max') }
            ]}
          >
            <Input
              placeholder={t('sections.name.placeholder')}
              size="large"
              className="form-input"
            />
          </Form.Item>

          <Form.Item
            label={t('sections.growthStage')}
            name="type"
            rules={[
              { required: true, message: t('sections.growthStage.validation') }
            ]}
          >
            <Select
              placeholder={t('sections.growthStage.placeholder')}
              size="large"
              className="form-select"
            >
              {growthStageOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  <div className="select-option">
                    <img className="option-icon" src={option.image ?? ''} alt="" aria-hidden="true" />
                    <span className="option-label">{option.label}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Separado del formulario: cambiar el hub tiene efecto inmediato, no espera a
              "Actualizar sección". Mezclarlo con los campos haría creer que se guarda junto. */}
          <div className="hub-section">
            <div className="hub-section__label">{t('sections.hub.label')}</div>

            {hubsLoading ? (
              <div className="hub-section__empty">{t('common.loading')}</div>
            ) : currentHub ? (
              <>
                <div className="hub-section__current">
                  <span className="hub-mac">{currentHub.deviceHubId}</span>
                  <Button type="link" danger size="small" onClick={handleRemoveHub} disabled={submitting}>
                    {t('sections.hub.remove')}
                  </Button>
                </div>
                {currentHub.installedAt && (
                  <div className="hub-section__hint">
                    {t('sections.hub.installedSince', {
                      date: new Date(currentHub.installedAt).toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }),
                    })}
                  </div>
                )}
              </>
            ) : availableHubs.length === 0 ? (
              <div className="hub-section__empty">{t('sections.hub.noneAvailable')}</div>
            ) : (
              <div className="hub-section__assign">
                {/* Desplegable de los hubs que YA reportaron: nadie teclea una MAC, que era
                    de donde salían los duplicados por error de tipeo. */}
                <Select
                  value={pendingHubId ?? undefined}
                  onChange={setPendingHubId}
                  placeholder={t('sections.hub.selectPlaceholder')}
                  className="hub-select"
                  size="large"
                >
                  {availableHubs.map((hub) => (
                    <Option key={hub.id} value={hub.id}>
                      {hub.deviceHubId}
                    </Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  onClick={handleAssignHub}
                  disabled={pendingHubId == null || submitting}
                >
                  {t('sections.hub.assign')}
                </Button>
              </div>
            )}
          </div>

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
              {t('sections.edit.button')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};