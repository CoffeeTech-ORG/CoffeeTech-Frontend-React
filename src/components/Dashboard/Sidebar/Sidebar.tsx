import React from 'react';
import { Menu } from 'antd';
import { 
  BarChart3, 
  FileText, 
  Settings, 
  HelpCircle,
  Plus
} from 'lucide-react';
import { Logo } from '../../Logo/Logo';
import './Sidebar.scss';

interface SidebarProps {
  activeKey: string;
  onMenuClick: (key: string) => void;
  onAddFarm: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeKey, onMenuClick, onAddFarm }) => {
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
      label: 'Settings',
    },
    {
      key: 'help',
      icon: <HelpCircle size={20} />,
      label: 'Help',
    },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <Logo size="large" />
      </div>
      
      <Menu
        mode="vertical"
        selectedKeys={[activeKey]}
        className="sidebar__menu"
        onSelect={({ key }) => onMenuClick(key)}
        items={menuItems}
      />
      
      <div className="sidebar__footer">
        <button className="sidebar__add-farm" onClick={onAddFarm}>
          <Plus size={20} />
          <span>ADD FARM</span>
        </button>
      </div>
    </div>
  );
};