import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { X } from 'lucide-react';
import { Section } from '../../../services/farms.service';
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
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const growthStageOptions = [
    { value: 'plantula', label: 'Plántula', icon: '🌱' },
    { value: 'vegetativo', label: 'Vegetativo', icon: '🌿' },
    { value: 'floracion', label: 'Floración', icon: '🌸' },
    { value: 'fructificacion', label: 'Fructificación', icon: '🍃' },
    { value: 'maduracion', label: 'Maduración', icon: '🟡' },
    { value: 'cosecha', label: 'Cosecha', icon: '☕' }
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
      message.error('Failed to update section. Please try again.');
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
        <h2 className="modal-title">Edit Section</h2>
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
            label="Section Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter a section name' },
              { min: 2, message: 'Section name must be at least 2 characters' },
              { max: 50, message: 'Section name cannot exceed 50 characters' }
            ]}
          >
            <Input
              placeholder="Enter section name"
              size="large"
              className="form-input"
            />
          </Form.Item>

          <Form.Item
            label="Growth Stage"
            name="type"
            rules={[
              { required: true, message: 'Please select a growth stage' }
            ]}
          >
            <Select
              placeholder="Select growth stage"
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
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={submitting}
              className="submit-btn"
            >
              Update Section
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};