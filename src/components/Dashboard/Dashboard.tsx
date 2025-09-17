import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar/Sidebar';
import { WeatherWidget } from './WeatherWidget/WeatherWidget';
import { FarmCard } from './FarmCard/FarmCard';
import { useAuth } from '../../contexts/AuthContext';
import { farmsService, Farm, WeatherData } from '../../services/farms.service';
import { Button, Spin, message } from 'antd';
import { User, Bell } from 'lucide-react';
import './Dashboard.scss';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [farmsData, weatherData] = await Promise.all([
        farmsService.getFarms(),
        farmsService.getWeatherData()
      ]);
      setFarms(farmsData);
      setWeather(weatherData);
    } catch (error) {
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFarm = () => {
    message.info('Add Farm functionality will be implemented');
  };

  const handleViewDetails = (farmId: string) => {
    message.info(`View details for farm ${farmId}`);
  };

  const handleSettings = (farmId: string) => {
    message.info(`Settings for farm ${farmId}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            {weather && <WeatherWidget weather={weather} />}
            
            <div className="farms-section">
              <h2 className="section-title">My Farms</h2>
              {loading ? (
                <div className="loading-container">
                  <Spin size="large" />
                </div>
              ) : (
                <div className="farms-grid">
                  {farms.map((farm) => (
                    <FarmCard
                      key={farm.id}
                      farm={farm}
                      onViewDetails={handleViewDetails}
                      onSettings={handleSettings}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'reports':
        return (
          <div className="dashboard-content">
            <h2 className="section-title">Reports</h2>
            <p>Reports functionality will be implemented here.</p>
          </div>
        );
      
      case 'settings':
        return (
          <div className="dashboard-content">
            <h2 className="section-title">Settings</h2>
            <p>Settings functionality will be implemented here.</p>
          </div>
        );
      
      case 'help':
        return (
          <div className="dashboard-content">
            <h2 className="section-title">Help</h2>
            <p>Help and documentation will be available here.</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading && !weather) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar
        activeKey={activeTab}
        onMenuClick={setActiveTab}
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
};