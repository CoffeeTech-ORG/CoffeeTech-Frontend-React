import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { X } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';
import { GROWTH_STAGES, stageImage } from '../../../utils/growthStage';
import { sensorService } from '../../../services/sensor.service';
import { Sensor } from '../../../types/sensor.types';
import './AddSectionModal.scss';

const { Option } = Select;

export interface AddSectionData {
  name: string;
  growthStage: 'plantula' | 'vegetativo' | 'floracion' | 'fructificacion' | 'maduracion' | 'cosecha';
  /**
   * A hub to link in the same step. Optional: a section can exist before it has equipment. Offered
   * here so a new section need not go create -> edit -> assign, born "no hub" and fixed on a second
   * pass.
   */
  deviceId?: number;
}

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddSectionData) => Promise<void>;
  loading?: boolean;
  farmId: string;
}

export const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // The project images, not emoji: the same seen on entering the section.
  const growthStageOptions = GROWTH_STAGES.map((key) => ({
    value: key,
    label: t(`sectionType.${key}`),
    image: stageImage(key),
  }));

  /**
   * Linkable hubs: only those that have ALREADY reported and are not in another plot. A hub assigned
   * elsewhere is not offered: moving it would leave that section without data, and that must not
   * happen by accident from a create dropdown.
   */
  const [availableHubs, setAvailableHubs] = useState<Sensor[]>([]);
  const [hubsLoading, setHubsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setHubsLoading(true);
    sensorService
      .getAllSensors()
      .then((list) => !cancelled && setAvailableHubs(list.filter((h) => h.sectionId == null)))
      .catch(() => !cancelled && setAvailableHubs([]))
      .finally(() => !cancelled && setHubsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSubmit = async (values: AddSectionData) => {
    try {
      setSubmitting(true);
      await onSubmit(values);
      form.resetFields();
      onClose();
      message.success(t('sections.success.create'));
    } catch (error) {
      console.error('Error adding section:', error);
      message.error(t('sections.error.create'));
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
      className="add-section-modal"
      closable={false}
    >
      <div className="modal-header">
        <h2 className="modal-title">{t('sections.add')}</h2>
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
            name="growthStage"
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

          {/* El enlace del hub va tras una divisoria: es opcional y de otra naturaleza que
              el nombre y la etapa, que sí son obligatorios. */}
          <div className="hub-field">
            <Form.Item label={t('sections.hub.labelOptional')} name="deviceId">
              <Select
                placeholder={
                  hubsLoading
                    ? t('common.loading')
                    : availableHubs.length === 0
                    ? t('sections.hub.noneAvailableShort')
                    : t('sections.hub.selectPlaceholder')
                }
                size="large"
                className="form-select"
                allowClear
                // With no free hubs the dropdown is unusable but stays visible with its note:
                // hiding it would leave the user unaware the option exists.
                disabled={hubsLoading || availableHubs.length === 0}
              >
                {availableHubs.map((hub) => (
                  <Option key={hub.id} value={hub.id}>
                    {hub.deviceHubId}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <div className="hub-field__hint">
              {availableHubs.length === 0 && !hubsLoading
                ? t('sections.hub.noneAvailable')
                : t('sections.hub.optionalHint')}
            </div>
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
              {t('sections.add')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};