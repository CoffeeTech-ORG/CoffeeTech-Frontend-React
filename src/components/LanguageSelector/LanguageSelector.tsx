import React from 'react';
import { Button, Dropdown } from 'antd';
import { Languages } from 'lucide-react';
import { useI18n, Language } from '../../contexts/I18nContext';
import type { MenuProps } from 'antd';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useI18n();

  const handleLanguageChange = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
  };

  const items: MenuProps['items'] = [
    {
      key: 'en',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🇺🇸</span>
          <span>English</span>
        </div>
      ),
      onClick: () => handleLanguageChange('en'),
    },
    {
      key: 'es',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🇪🇸</span>
          <span>Español</span>
        </div>
      ),
      onClick: () => handleLanguageChange('es'),
    },
  ];

  const getCurrentLanguageFlag = () => {
    return language === 'en' ? '🇺🇸' : '🇪🇸';
  };

  return (
    <Dropdown
      menu={{ items }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button
        type="text"
        className="header-btn language-selector"
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <span style={{ fontSize: '16px' }}>{getCurrentLanguageFlag()}</span>
        <Languages size={16} />
      </Button>
    </Dropdown>
  );
};