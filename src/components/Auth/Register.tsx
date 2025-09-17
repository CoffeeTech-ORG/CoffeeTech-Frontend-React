import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../Logo/Logo';
import './Auth.scss';

const { Title, Text, Link } = Typography;

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterProps {
  onSwitchToLogin: () => void;
  onBack?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onBack }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      message.success('Registration successful!');
      // Redirect to dashboard after successful registration
      navigate('/dashboard', { replace: true });
    } catch (error) {
      message.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {onBack && (
          <button className="auth-back-btn" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
        )}
        
        <div className="auth-header">
          <Logo size="large" />
          <Title level={2} className="auth-title">Sign Up</Title>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="auth-form"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input
              placeholder="Username"
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              placeholder="Email"
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              placeholder="Password"
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Confirm Password"
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              className="auth-submit-btn"
            >
              SIGN UP
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Text className="auth-switch">
            Already have your account?{' '}
            <Link onClick={onSwitchToLogin}>Log In</Link>
          </Text>
        </div>
      </div>
    </div>
  );
};