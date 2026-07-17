import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import './ManagerOnly.scss';

/**
 * A farm, section or hub the URL names but that does not exist -- or no longer does.
 *
 * With addresses now shareable and bookmarkable, this case is real: a link messaged to a farm that
 * was later deleted. Returning Home with no explanation would suggest the app failed.
 *
 * `kind` is not decorative: telling someone who was after a device "that section is gone" makes them
 * doubt whether they used the wrong link or the app got confused.
 */
export const NotFound: React.FC<{ kind: 'farm' | 'section' | 'hub' }> = ({ kind }) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="manager-only">
      <div className="manager-only__icon" aria-hidden="true">
        <SearchX size={26} />
      </div>
      <h2 className="manager-only__title">{t(`notFound.${kind}.title`)}</h2>
      <p className="manager-only__body">{t('notFound.body')}</p>
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
