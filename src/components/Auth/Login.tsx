import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../Logo/Logo';
import './Auth.scss';

const { Title, Text, Link } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginProps {
  onSwitchToRegister: () => void;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onBack }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true);
    try {
      await loginWithCredentials(values.email, values.password);
      message.success('Login successful!');
      
      // Redirigir al dashboard o a la página anterior
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
      console.error('Login error:', error);
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
          <Title level={2} className="auth-title">Log In</Title>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="auth-form"
        >
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
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              placeholder="Password"
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
              LOG IN
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Link className="auth-link">Forgot Password?</Link>
          <Text className="auth-switch">
            Don't have an account?{' '}
            <Link onClick={onSwitchToRegister}>Sign Up</Link>
          </Text>
        </div>
      </div>
    </div>
  );
};