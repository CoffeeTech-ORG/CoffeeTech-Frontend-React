import React from 'react';
import { Button, message } from 'antd';
import { ArrowLeft, User, Bell } from 'lucide-react';
import { Sidebar } from './Dashboard/Sidebar/Sidebar';
import SectionData from './SectionData/SectionData';
import { Section } from '../types/api.types';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard/Dashboard.scss';

interface SectionDetailViewProps {
  section: Section;
  onBack: () => void;
}

export const SectionDetailView: React.FC<SectionDetailViewProps> = ({ section, onBack }) => {
  const { user, token, logout } = useAuth();

  const handleAddFarm = () => {
    message.info('Add Farm functionality will be implemented');
  };

  const handleMenuClick = (key: string) => {
    if (key === 'dashboard') {
      onBack();
    } else {
      message.info(`Navigate to ${key}`);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar
        activeKey="dashboard"
        onMenuClick={handleMenuClick}
        onAddFarm={handleAddFarm}
      />
      
      <div className="dashboard__main">
        <header className="dashboard__header">
          <div className="header-left">
            <h1>CoffeeTech</h1>
          </div>
          
          <div className="header-right">
            <Button
              icon={<Bell size={20} />}
              type="text"
              className="header-btn"
            />
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
            <div className="section-detail__header">
              <Button
                type="text"
                icon={<ArrowLeft size={20} />}
                onClick={onBack}
                className="back-btn"
              >
                Back to Sections
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