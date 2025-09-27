import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { X } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';
import './AddSectionModal.scss';

const { Option } = Select;

export interface AddSectionData {
  name: string;
  growthStage: 'plantula' | 'vegetativo' | 'floracion' | 'fructificacion' | 'maduracion' | 'cosecha';
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

  const growthStageOptions = [
    { value: 'plantula', label: t('sectionType.plantula'), icon: '🌱' },
    { value: 'vegetativo', label: t('sectionType.vegetativo'), icon: '🌿' },
    { value: 'floracion', label: t('sectionType.floracion'), icon: '🌸' },
    { value: 'fructificacion', label: t('sectionType.fructificacion'), icon: '🍃' },
    { value: 'maduracion', label: t('sectionType.maduracion'), icon: '🟡' },
    { value: 'cosecha', label: t('sectionType.cosecha'), icon: '☕' }
  ];

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
              {t('sections.add')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};