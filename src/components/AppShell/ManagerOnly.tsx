import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import './ManagerOnly.scss';

/**
 * Wraps the routes only the Manager can see (Reports, Hubs).
 *
 * Shows an explanation instead of redirecting silently. An unexpected jump to Home reads as an app
 * failure; saying who can do it, and what to do about it, turns a bounce into an answer.
 *
 * Not security: the backend still decides. This is so the user understands why they cannot see
 * something.
 */
export const ManagerOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  if (user?.role?.id === 1) return <>{children}</>;

  return (
    <div className="manager-only">
      <div className="manager-only__icon" aria-hidden="true">
        <Lock size={26} />
      </div>
      <h2 className="manager-only__title">{t('access.managerOnly.title')}</h2>
      <p className="manager-only__body">{t('access.managerOnly.body')}</p>
      <button
        type="button"
        className="manager-only__action"
        onClick={() => navigate('/dashboard')}
      >
        {t('access.managerOnly.action')}
      </button>
    </div>
  );
};
