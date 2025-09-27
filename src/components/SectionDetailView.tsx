import React from 'react';
import { Button, message } from 'antd';
import { ArrowLeft, User, Bell } from 'lucide-react';
import { Sidebar } from './Dashboard/Sidebar/Sidebar';
import SectionData from './SectionData/SectionData';
import { Section } from '../types/api.types';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import './Dashboard/Dashboard.scss';
import { LanguageSelector } from './LanguageSelector';

interface SectionDetailViewProps {
  section: Section;
  onBack: () => void;
  onNavigateToSection?: (key: string) => void;
}

export const SectionDetailView: React.FC<SectionDetailViewProps> = ({ section, onBack, onNavigateToSection }) => {
  const { user, token, logout } = useAuth();
  const { t } = useI18n();

  const handleMenuClick = (key: string) => {
    if (key === 'dashboard') {
      onBack();
    } else if (onNavigateToSection) {
      onNavigateToSection(key);
    } else {
      message.info(`Navigate to ${key}`);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar
        activeKey="dashboard"
        onMenuClick={handleMenuClick}
      />
      
      <div className="dashboard__main">
        <header className="dashboard__header">
          <div className="header-left">
            <h1>{t('dashboard.title')}</h1>
          </div>
          
          <div className="header-right">
            <LanguageSelector />
            <Button
              icon={<User size={20} />}
              type="text"
              className="header-btn"
              onClick={logout}
            >
              {user?.username}
            </Button>
          </div>
        </header>
        
        <main className="dashboard__content">
          <div className="section-detail">
            <div className="section-detail__header" style={{ marginBottom: '12px' }}>
              <Button
                type="text"
                icon={<ArrowLeft size={20} />}
                onClick={onBack}
                className="back-btn"
              >
                {t('nav.back')} to {t('sections.title')}
              </Button>
            </div>
            
            <SectionData 
              authToken={token ?? null} 
              section={section}
              onClose={onBack}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SectionDetailView;