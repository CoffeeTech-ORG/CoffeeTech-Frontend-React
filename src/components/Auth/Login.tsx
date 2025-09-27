import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
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
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true);
    try {
      await loginWithCredentials(values.email, values.password);
      message.success(t('auth.success.login'));
      
      // Redirigir al dashboard o a la página anterior
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      message.error(t('auth.error.login'));
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
          <Title level={2} className="auth-title">{t('auth.login.title')}</Title>
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
              { required: true, message: t('auth.validation.email') },
              { type: 'email', message: t('auth.validation.email.valid') }
            ]}
          >
            <Input
              placeholder={t('auth.email')}
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('auth.validation.password') }]}
          >
            <Input.Password
              placeholder={t('auth.password')}
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
              {t('auth.login.button')}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          {/* <Link className="auth-link">Forgot Password?</Link> */}
          <Text className="auth-switch">
            {t('auth.switch.register')}{' '}
            <Link onClick={onSwitchToRegister}>{t('auth.register.title')}</Link>
          </Text>
        </div>
      </div>
    </div>
  );
};