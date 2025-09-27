import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { 
  BarChart3, 
  FileText, 
  Settings, 
  HelpCircle,
  Plus
} from 'lucide-react';
import { Logo } from '../../Logo/Logo';
import { AddFarmModal, AddFarmData } from '../AddFarmModal/AddFarmModal';
import { createFarm } from '../../../services/farms.createFarm';
import { useAuth } from '../../../contexts/AuthContext';
import './Sidebar.scss';

interface SidebarProps {
  activeKey: string;
  onMenuClick: (key: string) => void;
  onAddFarm?: () => void;
  onFarmCreated?: () => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeKey, onMenuClick, onAddFarm, onFarmCreated }) => {
  const { user } = useAuth();
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const menuItems = [
    {
      key: 'dashboard',
      icon: <BarChart3 size={20} />,
      label: 'Dashboard',
    },
    {
      key: 'reports',
      icon: <FileText size={20} />,
      label: 'Reports',
    },
    {
      key: 'settings',
      icon: <Settings size={20} />,
      label: 'Sensor Inventory',
    },
  ];

  const handleAddFarmClick = () => {
    setIsAddFarmOpen(true);
    if (onAddFarm) onAddFarm();
  };

  const handleAddFarmClose = () => {
    setIsAddFarmOpen(false);
  };

  const handleAddFarmSubmit = async (data: AddFarmData) => {
    setLoading(true);
    try {
      if (!user) throw new Error('No user found');
      await createFarm(data, user.id);
      
      // Notify parent component that a new farm was created
      if (onFarmCreated) {
        await onFarmCreated();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <Logo size={isMobile ? "medium" : "large"} />
      </div>
      <Menu
        mode="vertical"
        selectedKeys={[activeKey]}
        className="sidebar__menu"
        onSelect={({ key }) => onMenuClick(key)}
        items={menuItems}
      />
      <div className="sidebar__footer">
        <button className="sidebar__add-farm" onClick={handleAddFarmClick}>
          <Plus size={20} />
          <span>ADD FARM</span>
        </button>
      </div>
      <AddFarmModal
        isOpen={isAddFarmOpen}
        onClose={handleAddFarmClose}
        onSubmit={handleAddFarmSubmit}
        loading={loading}
      />
    </div>
  );
};