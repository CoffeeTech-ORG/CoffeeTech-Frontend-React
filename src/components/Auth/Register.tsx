import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Segmented } from 'antd';
import { ArrowLeft, Users, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { Logo } from '../Logo/Logo';
import './Auth.scss';

const { Title, Text, Link } = Typography;

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  rolId: number;
}

interface RegisterProps {
  onSwitchToLogin: () => void;
  onBack?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onBack }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        rolId: values.rolId,
      });
      message.success(t('auth.success.register'));
      // Redirect to dashboard after successful registration
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      // Log completo para debugging (solo visible en consola del navegador)
      console.error('Registration error:', {
        error,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message
      });
      
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.message;
      
      if (status === 400) {
        // Bad request - check if it's a duplicate email error
        if (serverMsg && serverMsg.includes('correo') && serverMsg.includes('registrado')) {
          // Email already registered error
          message.error(serverMsg || t('auth.error.emailTaken'));
        } else {
          // Other validation errors
          message.error(serverMsg || t('auth.error.validation') || 'Datos de registro inválidos');
        }
      } else if (status === 409) {
        // Conflict - duplicate resource
        message.error(serverMsg || t('auth.error.emailTaken'));
      } else if (status === 500 || status === 502 || status === 503) {
        // Server errors
        message.error(t('auth.error.server') || 'Error del servidor. Por favor, intenta más tarde');
      } else if (!error?.response) {
        // Network error (no response from server)
        message.error(t('auth.error.network') || 'Error de conexión. Verifica tu internet');
      } else {
        // Generic error
        message.error(serverMsg || t('auth.error.register') || 'Error al registrar. Intenta nuevamente');
      }
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
          <Title level={2} className="auth-title">{t('auth.register.title')}</Title>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="auth-form"
          initialValues={{ rolId: 2 }}
        >

          <Form.Item
            name="rolId"
            rules={[{ required: true, message: t('auth.validation.role') }]}
          >
            <Segmented
              size="large"
              options={[
                {
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} />
                      <span>{t('auth.manager')}</span>
                    </div>
                  ),
                  value: 1,
                },
                {
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={16} />
                      <span>{t('auth.farmer')}</span>
                    </div>
                  ),
                  value: 2,
                },
              ]}
              className="role-selector"
            />
          </Form.Item>

          <Form.Item
            name="username"
            rules={[{ required: true, message: t('auth.validation.username') }]}
          >
            <Input
              placeholder={t('auth.username')}
              size="large"
              className="auth-input"
            />
          </Form.Item>

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
            rules={[
              { required: true, message: t('auth.validation.password') },
              { min: 6, message: t('auth.validation.password.min') }
            ]}
          >
            <Input.Password
              placeholder={t('auth.password')}
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: t('auth.validation.confirmPassword') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('auth.validation.passwords.match')));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder={t('auth.confirmPassword')}
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
              {t('auth.register.button')}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Text className="auth-switch">
            {t('auth.switch.login')}{' '}
            <Link onClick={onSwitchToLogin}>{t('auth.login.title')}</Link>
          </Text>
        </div>
      </div>
    </div>
  );
};