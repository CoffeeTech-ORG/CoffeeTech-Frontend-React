import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { X } from 'lucide-react';
import './AddFarmModal.scss';

export interface AddFarmData {
  name: string;
  location: string;
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
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: AddFarmData) => {
    try {
      setSubmitting(true);
      await onSubmit(values);
      form.resetFields();
      onClose();
      message.success('Farm added successfully!');
    } catch (error) {
      console.error('Error adding farm:', error);
      message.error('Failed to add farm. Please try again.');
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
        <h2 className="modal-title">Add New Farm</h2>
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
            label="Farm Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter a farm name' },
              { min: 2, message: 'Farm name must be at least 2 characters' },
              { max: 50, message: 'Farm name cannot exceed 50 characters' }
            ]}
          >
            <Input
              placeholder="Enter farm name"
              size="large"
              className="form-input"
            />
          </Form.Item>

          <Form.Item
            label="Location"
            name="location"
            rules={[
              { required: true, message: 'Please enter a location' },
              { min: 2, message: 'Location must be at least 2 characters' },
              { max: 100, message: 'Location cannot exceed 100 characters' }
            ]}
          >
            <Input
              placeholder="Enter location"
              size="large"
              className="form-input"
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
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={submitting}
              className="submit-btn"
            >
              Add Farm
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
