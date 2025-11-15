import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar/Sidebar';
import { WeatherWidget } from './WeatherWidget/WeatherWidget';
import { FarmCard } from './FarmCard/FarmCard';
import { FarmSections } from './FarmSections/FarmSections';
import SectionDetailView from '../SectionDetailView';
import { SensorInventory } from '../SensorInventory/SensorInventory';
import { Reports } from '../Reports/Reports';
import { EditFarmModal, EditFarmData } from './EditFarmModal/EditFarmModal';
import { DeleteFarmModal } from './DeleteFarmModal/DeleteFarmModal';
import { FarmMapModal } from './FarmMapModal/FarmMapModal';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { useFarms, Farm, Section, WeatherData } from '../../hooks/useFarms';
import { farmsService } from '../../services/farms.service';
import { LanguageSelector } from '../LanguageSelector';
import { Button, Spin, message } from 'antd';
import { LogOutIcon } from 'lucide-react';
import './Dashboard.scss';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'farm-sections' | 'section-detail'>('dashboard');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [farmToEdit, setFarmToEdit] = useState<Farm | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [farmToViewMap, setFarmToViewMap] = useState<Farm | null>(null);
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { getFarms, getWeatherData } = useFarms();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [farmsData, weatherData] = await Promise.all([
        getFarms(),
        getWeatherData()
      ]);
      setFarms(farmsData);
      setWeather(weatherData);
    } catch (error) {
      message.error(t('dashboard.error.loadData'));
    } finally {
      setLoading(false);
    }
  };


  const handleViewDetails = (farmId: string) => {
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
      setSelectedFarm(farm);
      setCurrentView('farm-sections');
    }
  };

  const handleEdit = (farmId: string) => {
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
      setFarmToEdit(farm);
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = (farmId: string) => {
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
      setFarmToDelete(farm);
      setIsDeleteModalOpen(true);
    }
  };

  const handleViewMap = (farmId: string) => {
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
      setFarmToViewMap(farm);
      setIsMapModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!farmToDelete) return;

    try {
      const farmIdNumber = parseInt(farmToDelete.id, 10);
      if (isNaN(farmIdNumber)) {
        throw new Error('Invalid farm ID');
      }

      await farmsService.deleteFarm(farmIdNumber);
      
      // Remove the farm from the local state
      setFarms(prevFarms => prevFarms.filter(f => f.id !== farmToDelete.id));
      
      message.success(t('farm.success.delete'));
    } catch (error) {
      console.error('Error deleting farm:', error);
      message.error(t('farm.error.delete'));
      throw error; // Re-throw to let the modal handle the loading state
    }
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setFarmToDelete(null);
  };

  const handleEditSubmit = async (data: EditFarmData) => {
    try {
      console.log('Updating farm with data:', data);
      
      await farmsService.updateFarm(data.id, {
        name: data.name,
        location: data.location,
        altitude: data.altitude
      });
      
      // Reload the farms list to ensure we have the latest data
      const updatedFarms = await getFarms();
      setFarms(updatedFarms);
      
      setIsEditModalOpen(false);
      setFarmToEdit(null);
      message.success(t('farm.success.update'));
    } catch (error) {
      console.error('Error updating farm:', error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setFarmToEdit(null);
  };

  const handleFarmCreated = async () => {
    // Reload farms after a new farm is created
    try {
      const updatedFarms = await getFarms();
      setFarms(updatedFarms);
    } catch (error) {
      console.error('Error reloading farms after creation:', error);
      // Don't show error message here as the creation was successful
      // Just log it for debugging
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedFarm(null);
    setSelectedSection(null);
    setActiveTab('dashboard');
  };

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
    setCurrentView('section-detail');
  };

  const handleBackToFarmSections = () => {
    setCurrentView('farm-sections');
    setSelectedSection(null);
  };

  const handleNavigateFromSubView = (key: string) => {
    setCurrentView('dashboard');
    setSelectedFarm(null);
    setSelectedSection(null);
    setActiveTab(key);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            {weather && <WeatherWidget weather={weather} />}
            
            <div className="farms-section">
              <h2 className="section-title">{t('dashboard.myFarms')}</h2>
              {loading ? (
                <div className="loading-container">
                  <Spin size="large" />
                </div>
              ) : farms.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-content">
                    <div className="empty-state-icon">
                      🏡
                    </div>
                    <h3 className="empty-state-title">{t('dashboard.empty.title')}</h3>
                    <p className="empty-state-description">
                      {t('dashboard.empty.description')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="farms-grid">
                  {farms.map((farm) => (
                    <FarmCard
                      key={farm.id}
                      farm={farm}
                      onViewDetails={handleViewDetails}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onViewMap={handleViewMap}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'reports':
        return <Reports />;
      
      case 'settings':
        return <SensorInventory />;

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

  // Show section detail view
  if (currentView === 'section-detail' && selectedSection) {
    return (
      <SectionDetailView 
        section={selectedSection} 
        onBack={handleBackToFarmSections} 
        onNavigateToSection={handleNavigateFromSubView}
      />
    );
  }

  // Show farm sections view
  if (currentView === 'farm-sections' && selectedFarm) {
    return (
      <FarmSections 
        farm={selectedFarm} 
        onBack={handleBackToDashboard}
        onSectionSelect={handleSectionSelect}
        onNavigateToSection={handleNavigateFromSubView}
      />
    );
  }

  return (
    <div className="dashboard">
      <Sidebar
        activeKey={activeTab}
        onMenuClick={setActiveTab}
        onFarmCreated={handleFarmCreated}
      />
      
      <div className="dashboard__main">
        <header className="dashboard__header">
          <div className="header-left">
            <h1>{t('dashboard.title')}</h1>
          </div>
          
          <div className="header-right">
            <LanguageSelector />
            
            <Button
              type="text"
              className="header-btn"
              onClick={logout}
            >
              {user?.username}&nbsp;
              <LogOutIcon size={20} />
            </Button>
          </div>
        </header>
        
        <main className="dashboard__content">
          {renderContent()}
        </main>
      </div>

      <EditFarmModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSubmit={handleEditSubmit}
        farm={farmToEdit}
      />

      <DeleteFarmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        farm={farmToDelete}
      />

      <FarmMapModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setFarmToViewMap(null);
        }}
        farmName={farmToViewMap?.name || ''}
        location={farmToViewMap?.location || ''}
      />
    </div>
  );
};