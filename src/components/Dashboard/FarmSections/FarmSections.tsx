import React, { useState, useEffect } from 'react';
import { Button, Spin, message } from 'antd';
import { ArrowLeft, Plus, User, Bell } from 'lucide-react';
import { Sidebar } from '../Sidebar/Sidebar';
import { SectionCard } from '../SectionCard/SectionCard';
import { AddSectionModal, AddSectionData } from '../AddSectionModal/AddSectionModal';
import { useFarms, Farm, Section } from '../../../hooks/useFarms';
import { useAuth } from '../../../contexts/AuthContext';
import './FarmSections.scss';
import '../Dashboard.scss';

interface FarmSectionsProps {
  farm: Farm;
  onBack: () => void;
  onSectionSelect?: (section: Section) => void;
}

export const FarmSections: React.FC<FarmSectionsProps> = ({ farm, onBack, onSectionSelect }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [addingSectionLoading, setAddingSectionLoading] = useState(false);
  const { user, logout } = useAuth();
  const { getFarmSections, createSection } = useFarms();

  useEffect(() => {
    loadFarmSections();
  }, [farm.id]);

  const loadFarmSections = async () => {
    try {
      setLoading(true);
      const sectionsData = await getFarmSections(farm.id);
      setSections(sectionsData);
    } catch (error) {
      console.error('Error loading farm sections:', error);
      message.error('Failed to load farm sections');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionDetails = (sectionId: string) => {
    const found = sections.find(s => String(s.id) === String(sectionId)) ?? null;
    if (found && onSectionSelect) {
      onSectionSelect(found);
    } else {
      message.info(`View section details for ${sectionId}`);
    }
  };

  const handleSectionSettings = (sectionId: string) => {
    message.info(`Section settings for ${sectionId}`);
  };

  const handleAddSection = () => {
    setIsAddSectionModalOpen(true);
  };

  const handleCloseAddSectionModal = () => {
    setIsAddSectionModalOpen(false);
  };

  const handleSubmitAddSection = async (data: AddSectionData) => {
    try {
      setAddingSectionLoading(true);
      await createSection(farm.id, data);
      await loadFarmSections(); // Reload sections to show the new one
    } catch (error) {
      console.error('Error creating section:', error);
      throw error; // Re-throw to let the modal handle the error message
    } finally {
      setAddingSectionLoading(false);
    }
  };

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

  const getHealthSummary = () => {
    if (sections.length === 0) return { healthy: 0, warning: 0, critical: 0 };
    
    return sections.reduce((acc, section) => {
      acc[section.status]++;
      return acc;
    }, { healthy: 0, warning: 0, critical: 0 });
  };

  const healthSummary = getHealthSummary();
  const averageHealth = sections.length > 0 
    ? Math.round(sections.reduce((sum, section) => sum + section.healthPercentage, 0) / sections.length)
    : 0;

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
          <div className="farm-sections">
            <div className="farm-sections__header">
              <div className="header-left">
                <Button
                  type="text"
                  icon={<ArrowLeft size={20} />}
                  onClick={onBack}
                  className="back-btn"
                >
                  Back to Dashboard
                </Button>
                <div className="farm-info">
                  <h1 className="farm-name">{farm.name}</h1>
                  <p className="farm-location">{farm.location}</p>
                </div>
              </div>
              
              <Button
                type="primary"
                icon={<Plus size={20} />}
                onClick={handleAddSection}
                className="add-section-btn"
              >
                Add Section
              </Button>
            </div>

            <div className="farm-sections__summary">
              <div className="summary-card">
                <h3>Sections Overview</h3>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-number">{sections.length}</span>
                    <span className="stat-label">Total Sections</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{averageHealth}%</span>
                    <span className="stat-label">Average Health</span>
                  </div>
                  <div className="health-breakdown">
                    <div className="health-item healthy">
                      <span className="health-count">{healthSummary.healthy}</span>
                      <span className="health-label">Healthy</span>
                    </div>
                    <div className="health-item warning">
                      <span className="health-count">{healthSummary.warning}</span>
                      <span className="health-label">Warning</span>
                    </div>
                    <div className="health-item critical">
                      <span className="health-count">{healthSummary.critical}</span>
                      <span className="health-label">Critical</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="farm-sections__content">
              <h2 className="sections-title">Farm Sections</h2>
              
              {loading ? (
                <div className="loading-container">
                  <Spin size="large" />
                  <p>Loading sections...</p>
                </div>
              ) : sections.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__content">
                    <img 
                      src="/src/assets/section_icons/nosectionsfound1.png" 
                      alt="No sections found" 
                      className="empty-state__image"
                    />
                    <h3>No sections found</h3>
                    <p>This farm doesn't have any sections yet. Add your first section to get started.</p>
                  </div>
                </div>
              ) : (
                <div className="sections-grid">
                  {sections.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      onClick={handleSectionDetails}
                      onViewDetails={handleSectionDetails}
                      onSettings={handleSectionSettings}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={handleCloseAddSectionModal}
        onSubmit={handleSubmitAddSection}
        loading={addingSectionLoading}
        farmId={farm.id}
      />
    </div>
  );
};