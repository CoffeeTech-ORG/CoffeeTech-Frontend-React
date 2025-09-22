import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { X } from 'lucide-react';
import { Farm } from '../../../services/farms.service';
import './EditFarmModal.scss';

export interface EditFarmData {
  id: number;
  name: string;
  location: string;
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
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Set form values when farm data changes
  useEffect(() => {
    if (farm && isOpen) {
      form.setFieldsValue({
        name: farm.name,
        location: farm.location
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
        location: values.location
      });
      onClose();
    } catch (error) {
      console.error('Error updating farm:', error);
      message.error('Failed to update farm. Please try again.');
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
        <h2 className="modal-title">Edit Farm</h2>
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
              Update Farm
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};