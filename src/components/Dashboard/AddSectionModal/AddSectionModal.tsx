import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { X } from 'lucide-react';
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

  const handleSubmit = async (values: AddSectionData) => {
    try {
      setSubmitting(true);
      await onSubmit(values);
      form.resetFields();
      onClose();
      message.success('Section added successfully!');
    } catch (error) {
      console.error('Error adding section:', error);
      message.error('Failed to add section. Please try again.');
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
        <h2 className="modal-title">Add New Section</h2>
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
            label="Growth Stage Type"
            name="growthStage"
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
              Add Section
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};