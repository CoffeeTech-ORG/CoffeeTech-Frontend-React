import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { X } from 'lucide-react';
import { Section } from '../../../services/farms.service';
import { useI18n } from '../../../contexts/I18nContext';
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

  const growthStageOptions = [
    { value: 'plantula', label: t('sectionType.plantula'), icon: '🌱' },
    { value: 'vegetativo', label: t('sectionType.vegetativo'), icon: '🌿' },
    { value: 'floracion', label: t('sectionType.floracion'), icon: '🌸' },
    { value: 'fructificacion', label: t('sectionType.fructificacion'), icon: '🍃' },
    { value: 'maduracion', label: t('sectionType.maduracion'), icon: '🟡' },
    { value: 'cosecha', label: t('sectionType.cosecha'), icon: '☕' }
  ];

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
                    <span className="option-icon">{option.icon}</span>
                    <span className="option-label">{option.label}</span>
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