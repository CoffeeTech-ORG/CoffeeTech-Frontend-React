import React, { useState } from 'react';
import { SensorFormData, SensorType, SensorStatus } from '../../../types/sensor.types';
import './AddSensorModal.scss';

interface AddSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sensorData: SensorFormData) => Promise<boolean>;
}

const SENSOR_TYPES: SensorType[] = [
  'COMBINED',
  'TEMPERATURE', 
  'HUMIDITY', 
  'SOIL_MOISTURE', 
  'LIGHT', 
  'PH', 
  'CONDUCTIVITY'
];

const SENSOR_STATUSES: SensorStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

export const AddSensorModal: React.FC<AddSensorModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [formData, setFormData] = useState<SensorFormData>({
    sensorCode: '',
    type: 'COMBINED',
    location: '',
    status: 'INACTIVE'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<SensorFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<SensorFormData> = {};

    if (!formData.sensorCode.trim()) {
      newErrors.sensorCode = 'Sensor code is required';
    } else if (!/^[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}$/i.test(formData.sensorCode)) {
      newErrors.sensorCode = 'Invalid MAC address format (e.g., 1C:69:20:31:4B:78)';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const success = await onAdd(formData);
      if (success) {
        handleClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      sensorCode: '',
      type: 'COMBINED',
      location: '',
      status: 'INACTIVE'
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleInputChange = (field: keyof SensorFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const generateRandomMAC = () => {
    const chars = '0123456789ABCDEF';
    let mac = '';
    for (let i = 0; i < 6; i++) {
      if (i > 0) mac += ':';
      mac += chars[Math.floor(Math.random() * 16)];
      mac += chars[Math.floor(Math.random() * 16)];
    }
    handleInputChange('sensorCode', mac);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="add-sensor-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Sensor</h2>
          <button 
            className="close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Sensor Code */}
          <div className="form-group">
            <label htmlFor="sensorCode">
              Sensor Code (MAC Address) *
            </label>
            <div className="input-with-button">
              <input
                id="sensorCode"
                type="text"
                value={formData.sensorCode}
                onChange={(e) => handleInputChange('sensorCode', e.target.value)}
                placeholder="1C:69:20:31:4B:78"
                className={errors.sensorCode ? 'error' : ''}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={generateRandomMAC}
                className="generate-btn"
                disabled={isSubmitting}
                title="Generate random MAC address"
              >
                🎲
              </button>
            </div>
            {errors.sensorCode && (
              <span className="error-text">{errors.sensorCode}</span>
            )}
          </div>

          {/* Sensor Type */}
          <div className="form-group">
            <label htmlFor="type">Sensor Type *</label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value as SensorType)}
              className="form-select"
              disabled={isSubmitting}
            >
              {SENSOR_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Greenhouse A - Section 1"
              className={errors.location ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.location && (
              <span className="error-text">{errors.location}</span>
            )}
          </div>

          {/* Initial Status */}
          <div className="form-group">
            <label htmlFor="status">Initial Status</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as SensorStatus)}
              className="form-select"
              disabled={isSubmitting}
            >
              {SENSOR_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Sensor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};