import React, { useEffect, useState } from 'react';
import { App as AntdApp, Button, Input, Switch } from 'antd';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { useUserPhone } from '../../hooks/useUserPhone';
import { userService } from '../../services/user.service';
import './Profile.scss';

const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const ProfileView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useI18n();
  const { message } = AntdApp.useApp();
  const userId = user?.id;
  const { phone, loading, reload } = useUserPhone(userId);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Seed the account fields from the session.
  useEffect(() => {
    setUsername(user?.username ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  // Seed the editable fields from the loaded state.
  useEffect(() => {
    if (phone) {
      setPhoneNumber(phone.phoneNumber ?? '');
      setSmsOptIn(phone.smsOptIn);
    }
  }, [phone]);

  if (!userId || !user) return null;

  const emailValid = EMAIL.test(email.trim());
  const accountDirty = username.trim() !== user.username || email.trim() !== user.email;

  const phoneValid = phoneNumber.trim() === '' || E164.test(phoneNumber.trim());
  const dirty = phone
    ? phoneNumber.trim() !== (phone.phoneNumber ?? '') || smsOptIn !== phone.smsOptIn
    : phoneNumber.trim() !== '' || smsOptIn;

  const verified = phone?.phoneVerified ?? false;
  const hasNumber = !!phone?.phoneNumber;
  const alertsActive = verified && (phone?.smsOptIn ?? false);
  // The number is saved and still unverified, and the form is not mid-edit.
  const showVerify = hasNumber && !verified && !dirty;

  const handleSaveAccount = async () => {
    if (!emailValid || username.trim() === '') {
      message.error(t('profile.email.invalid'));
      return;
    }
    setSavingAccount(true);
    try {
      const updated = await userService.updateProfile(userId, username.trim(), email.trim());
      updateUser({ username: updated.username, email: updated.email });
      message.success(t('profile.saved'));
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      message.error(status === 409 ? t('profile.email.taken') : t('profile.account.saveError'));
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSave = async () => {
    if (!phoneValid) {
      message.error(t('profile.phone.invalid'));
      return;
    }
    setSaving(true);
    try {
      await userService.setPhone(userId, phoneNumber.trim() || null, smsOptIn);
      message.success(t('profile.saved'));
      await reload();
    } catch {
      message.error(t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      await userService.requestCode(userId);
      message.success(t('profile.verify.sent'));
    } catch {
      message.error(t('profile.verify.sendError'));
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await userService.verifyCode(userId, code.trim());
      message.success(t('profile.verify.ok'));
      setCode('');
      await reload();
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      message.error(status === 429 ? t('profile.verify.locked') : t('profile.verify.error'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="profile-view">
      <header className="profile-view__head">
        <h1 className="profile-view__title">{t('profile.title')}</h1>
        <p className="profile-view__lede">{t('profile.lede')}</p>
      </header>

      <section className="profile-card">
        <h2 className="profile-card__title">{t('profile.account')}</h2>

        <label className="profile-label" htmlFor="profile-username">{t('auth.username')}</label>
        <Input
          id="profile-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={100}
        />

        <label className="profile-label" htmlFor="profile-email">{t('auth.email')}</label>
        <Input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.email.placeholder')}
          status={email.trim() === '' || emailValid ? '' : 'error'}
        />
        {email.trim() !== '' && !emailValid && (
          <span className="profile-error">{t('profile.email.invalid')}</span>
        )}

        <Button
          type="primary"
          loading={savingAccount}
          disabled={!accountDirty || !emailValid || username.trim() === ''}
          onClick={handleSaveAccount}
        >
          {t('profile.save')}
        </Button>
      </section>

      <section className="profile-card">
        <h2 className="profile-card__title">{t('profile.sms.title')}</h2>
        <p className="profile-card__hint">{t('profile.sms.hint')}</p>

        <label className="profile-label" htmlFor="profile-phone">{t('profile.phone.label')}</label>
        <Input
          id="profile-phone"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+51987654321"
          status={phoneValid ? '' : 'error'}
          allowClear
          disabled={loading}
        />
        {!phoneValid && <span className="profile-error">{t('profile.phone.invalid')}</span>}

        <div className="profile-switch">
          <Switch id="profile-optin" checked={smsOptIn} onChange={setSmsOptIn} disabled={loading} />
          <label htmlFor="profile-optin">{t('profile.optin.label')}</label>
        </div>

        <div className="profile-status">
          {verified && (
            <span className="profile-badge is-ok">
              <ShieldCheck size={15} aria-hidden="true" /> {t('profile.verified')}
            </span>
          )}
          {hasNumber && !verified && (
            <span className="profile-badge is-warn">
              <AlertCircle size={15} aria-hidden="true" /> {t('profile.unverified')}
            </span>
          )}
          {alertsActive && <span className="profile-note">{t('profile.alertsActive')}</span>}
        </div>

        <Button
          type="primary"
          loading={saving}
          disabled={!dirty || !phoneValid || loading}
          onClick={handleSave}
        >
          {t('profile.save')}
        </Button>
      </section>

      {showVerify && (
        <section className="profile-card">
          <h2 className="profile-card__title">{t('profile.verify.title')}</h2>
          <p className="profile-card__hint">
            {t('profile.verify.hint', { phone: phone!.phoneNumber! })}
          </p>
          <div className="profile-verify">
            <Button onClick={handleSendCode} loading={sendingCode}>
              {t('profile.verify.send')}
            </Button>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              className="profile-code"
            />
            <Button
              type="primary"
              onClick={handleVerify}
              loading={verifying}
              disabled={code.trim().length < 4}
            >
              {t('profile.verify.confirm')}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};
