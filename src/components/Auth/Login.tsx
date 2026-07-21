import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { AuthLayout } from './AuthLayout';
import './Auth.scss';

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

      // Redirect to the dashboard or the previous page
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
    <AuthLayout
      title={t('auth.login.welcome')}
      subtitle={t('auth.login.lede')}
      onBack={onBack}
      footer={
        <>
          {t('auth.switch.register')}{' '}
          <button type="button" className="auth__link" onClick={onSwitchToRegister}>
            {t('auth.register.title')}
          </button>
        </>
      }
    >
      {/* Las etiquetas van SOBRE cada campo, como en el prototipo. Con sólo el marcador dentro,
          el campo se queda mudo en cuanto empiezas a escribir. */}
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="auth__form">
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
          rules={[{ required: true, message: t('auth.validation.password') }]}
        >
          {/* `Input.Password` ya trae el ojo de ver la contraseña que pide el diseño. */}
          <Input.Password
            size="large"
            autoComplete="current-password"
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
            {t('auth.login.button')}
          </Button>
        </Form.Item>

        {/* Debajo del botón, no encajado entre la contraseña y él: ahí apretaba el formulario y
            partía la secuencia «escribe · escribe · entra».
            Se ve, dice que aún no está, y no se puede pulsar —tampoco con teclado, porque es un
            <span> y no un enlace. El backend no tiene ninguna ruta de recuperación; ofrecer el
            enlace sería abrir una puerta que no lleva a ningún sitio, y esconderlo borraría que
            está previsto. Mismo trato que la exportación a PDF en Reportes. */}
        <span className="auth__forgot" aria-disabled="true">
          {t('auth.forgot')} <em>{t('common.soon')}</em>
        </span>
      </Form>
    </AuthLayout>
  );
};
