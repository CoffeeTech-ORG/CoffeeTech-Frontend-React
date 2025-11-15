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
      console.log('Error completo:', error);
      console.log('Error response:', error?.response);
      console.log('Error response data:', error?.response?.data);
      
      // Mensaje por defecto
      const defaultMsg = t('auth.error.register');
      
      // El backend devuelve un stack trace completo en response.data como string
      let errorText = '';
      
      if (error?.response?.data) {
        // Si response.data es un string, usarlo directamente
        errorText = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
      } else if (error?.message) {
        errorText = error.message;
      }

      console.log('Texto del error:', errorText);

      // Detectar texto indicando que el email ya está tomado
      if (/already taken|is already taken|already registered|email.*taken|correo.*ya.*registrad/i.test(errorText)) {
        const specific = t('auth.error.emailTaken') || 'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo';
        message.error(specific);
      } else {
        message.error(defaultMsg);
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