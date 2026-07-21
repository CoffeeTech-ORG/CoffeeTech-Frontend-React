import React, { useState } from 'react';
import { Form, Input, Button, message, Segmented } from 'antd';
import { Users, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { AuthLayout } from './AuthLayout';
import './Auth.scss';

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
      // Full log for debugging (browser console only)
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
    <AuthLayout
      title={t('auth.register.heading')}
      subtitle={t('auth.register.lede')}
      onBack={onBack}
      footer={
        <>
          {t('auth.switch.login')}{' '}
          <button type="button" className="auth__link" onClick={onSwitchToLogin}>
            {t('auth.login.title')}
          </button>
        </>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="auth__form"
        initialValues={{ rolId: 2 }}
      >
        <Form.Item
          name="rolId"
          label={t('auth.role')}
          rules={[{ required: true, message: t('auth.validation.role') }]}
        >
          <Segmented
            size="large"
            options={[
              {
                label: (
                  <>
                    <Users size={16} />
                    <span>{t('auth.manager')}</span>
                  </>
                ),
                value: 1,
              },
              {
                label: (
                  <>
                    <UserCheck size={16} />
                    <span>{t('auth.farmer')}</span>
                  </>
                ),
                value: 2,
              },
            ]}
            className="auth__role"
          />
        </Form.Item>

        <Form.Item
          name="username"
          label={t('auth.username')}
          rules={[{ required: true, message: t('auth.validation.username') }]}
        >
          <Input placeholder={t('auth.username.placeholder')} size="large" autoComplete="username" />
        </Form.Item>

        <Form.Item
          name="email"
          label={t('auth.email')}
          rules={[
            { required: true, message: t('auth.validation.email') },
            { type: 'email', message: t('auth.validation.email.valid') },
          ]}
        >
          <Input placeholder={t('auth.email.placeholder')} size="large" autoComplete="email" />
        </Form.Item>

        <Form.Item
          name="password"
          label={t('auth.password')}
          rules={[
            { required: true, message: t('auth.validation.password') },
            { min: 6, message: t('auth.validation.password.min') },
          ]}
        >
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={t('auth.confirmPassword')}
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
            placeholder={t('auth.confirmPassword.placeholder')}
            size="large"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="auth__submit"
          >
            {t('auth.register.button')}
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
};