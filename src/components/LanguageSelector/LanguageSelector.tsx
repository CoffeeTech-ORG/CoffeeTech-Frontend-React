import React from 'react';
import { Dropdown } from 'antd';
import { Globe } from 'lucide-react';
import { useI18n, Language } from '../../contexts/I18nContext';
import type { MenuProps } from 'antd';
import './LanguageSelector.scss';

interface LanguageSelectorProps {
  /**
   * `dark` for dark surfaces (top bar, the login's brand strip on mobile); `light` for light ones.
   * Only the colour changes: sizes and content are the same.
   */
  tone?: 'dark' | 'light';
}

/**
 * Language switcher.
 *
 * A globe, not a flag: a flag names a country, not a language, and this app's Spanish is spoken in
 * Peru, not Spain. The code sits beside it, and the icon uses `currentColor` so text and icon change
 * together and cannot fall out of step.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ tone = 'dark' }) => {
  const { language, setLanguage, t } = useI18n();

  // The dropdown has room for the full language name, which is clearer than the code.
  const items: MenuProps['items'] = [
    { key: 'es', label: 'Español', onClick: () => setLanguage('es' as Language) },
    { key: 'en', label: 'English', onClick: () => setLanguage('en' as Language) },
  ];

  return (
    <Dropdown menu={{ items, selectedKeys: [language] }} placement="bottomRight" trigger={['click']}>
      <button
        type="button"
        className={`lang-pill lang-pill--${tone}`}
        title={t('common.changeLanguage')}
        aria-label={t('common.changeLanguage')}
      >
        <Globe size={15} aria-hidden="true" />
        <span className="lang-pill__code">{language.toUpperCase()}</span>
        <span className="lang-pill__caret" aria-hidden="true">▾</span>
      </button>
    </Dropdown>
  );
};
