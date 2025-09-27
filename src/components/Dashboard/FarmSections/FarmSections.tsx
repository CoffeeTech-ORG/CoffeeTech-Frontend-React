import React, { useState, useEffect } from 'react';
import { Button, Spin, message, Dropdown, MenuProps } from 'antd';
import { ArrowLeft, Plus, User, Bell, MoreVertical } from 'lucide-react';
import { Sidebar } from '../Sidebar/Sidebar';
import { SectionCard } from '../SectionCard/SectionCard';
import { AddSectionModal, AddSectionData } from '../AddSectionModal/AddSectionModal';
import { AddDeviceModal, AddDeviceData } from '../AddDeviceModal/AddDeviceModal';
import { AssignDeviceModal, AssignDeviceData } from '../AssignDeviceModal/AssignDeviceModal';
import { EditSectionModal, EditSectionData } from '../EditSectionModal/EditSectionModal';
import { DeleteSectionModal } from '../DeleteSectionModal/DeleteSectionModal';
import { useFarms, Farm, Section } from '../../../hooks/useFarms';
import { farmsService } from '../../../services/farms.service';
import { useAuth } from '../../../contexts/AuthContext';
import { useI18n } from '../../../contexts/I18nContext';
import './FarmSections.scss';
import '../Dashboard.scss';
import { LanguageSelector } from '../../LanguageSelector';

interface FarmSectionsProps {
  farm: Farm;
  onBack: () => void;
  onSectionSelect?: (section: Section) => void;
  onNavigateToSection?: (key: string) => void;
}

export const FarmSections: React.FC<FarmSectionsProps> = ({ farm, onBack, onSectionSelect, onNavigateToSection }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [addingSectionLoading, setAddingSectionLoading] = useState(false);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [addingDeviceLoading, setAddingDeviceLoading] = useState(false);
  const [isAssignDeviceModalOpen, setIsAssignDeviceModalOpen] = useState(false);
  const [assigningDeviceLoading, setAssigningDeviceLoading] = useState(false);
  const [sectionToAssignDevice, setSectionToAssignDevice] = useState<Section | null>(null);
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null);
  const [isDeleteSectionModalOpen, setIsDeleteSectionModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const { user, logout } = useAuth();
  const { t } = useI18n();
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
      message.error(t('sections.error.create'));
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

  const handleSectionEdit = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setSectionToEdit(section);
      setIsEditSectionModalOpen(true);
    }
  };

  const handleSectionDelete = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setSectionToDelete(section);
      setIsDeleteSectionModalOpen(true);
    }
  };

  const handleDeleteSectionConfirm = async () => {
    if (!sectionToDelete) return;

    try {
      const sectionIdNumber = parseInt(sectionToDelete.id, 10);
      if (isNaN(sectionIdNumber)) {
        throw new Error('Invalid section ID');
      }

      await farmsService.deleteSection(sectionIdNumber);
      
      // Remove the section from the local state
      setSections(prevSections => prevSections.filter(s => s.id !== sectionToDelete.id));
      
      message.success(t('sections.success.delete'));
    } catch (error) {
      console.error('Error deleting section:', error);
      message.error(t('sections.error.delete'));
      throw error; // Re-throw to let the modal handle the loading state
    }
  };

  const handleDeleteSectionModalClose = () => {
    setIsDeleteSectionModalOpen(false);
    setSectionToDelete(null);
  };

  const handleEditSectionSubmit = async (data: EditSectionData) => {
    try {
      console.log('Updating section with data:', data);
      
      await farmsService.updateSection(data.id, {
        name: data.name,
        type: data.type
      });
      
      // Reload the sections list to ensure we have the latest data
      await loadFarmSections();
      
      setIsEditSectionModalOpen(false);
      setSectionToEdit(null);
      message.success(t('sections.success.update'));
    } catch (error) {
      console.error('Error updating section:', error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const handleEditSectionModalClose = () => {
    setIsEditSectionModalOpen(false);
    setSectionToEdit(null);
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

  const handleAddDevice = () => {
    setIsAddDeviceModalOpen(true);
  };

  const handleCloseAddDeviceModal = () => {
    setIsAddDeviceModalOpen(false);
  };

  const handleSubmitAddDevice = async (data: AddDeviceData) => {
    try {
      setAddingDeviceLoading(true);
      await farmsService.createDevice(data.deviceHubId);
      message.success(t('sensors.add') + ' successfully!');
      setIsAddDeviceModalOpen(false);
    } catch (error: any) {
      console.error('Error creating device:', error);
      
      // Check if it's a duplicate MAC address error
      if (error.message && error.message.includes('already exists')) {
        message.error('A device with this MAC address already exists. Please use a different MAC address.');
      } else {
        message.error('Failed to add device. Please try again.');
      }
      
      throw error; // Re-throw to let the modal handle the error message
    } finally {
      setAddingDeviceLoading(false);
    }
  };

  const handleAssignDevice = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setSectionToAssignDevice(section);
      setIsAssignDeviceModalOpen(true);
    }
  };

  const handleCloseAssignDeviceModal = () => {
    setIsAssignDeviceModalOpen(false);
    setSectionToAssignDevice(null);
  };

  const handleSubmitAssignDevice = async (data: AssignDeviceData) => {
    if (!sectionToAssignDevice) return;

    try {
      setAssigningDeviceLoading(true);
      const sectionIdNumber = parseInt(sectionToAssignDevice.id, 10);
      
      if (isNaN(sectionIdNumber)) {
        throw new Error('Invalid section ID');
      }

      await farmsService.createAssignment(sectionIdNumber, data.deviceId);
      message.success(t('sensors.assign') + ' successfully!');
      setIsAssignDeviceModalOpen(false);
      setSectionToAssignDevice(null);
    } catch (error: any) {
      console.error('Error assigning device:', error);
      message.error('Failed to assign device. Please try again.');
      throw error; // Re-throw to let the modal handle the error message
    } finally {
      setAssigningDeviceLoading(false);
    }
  };


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
          <div className="farm-sections">
            <div className="farm-sections__header">
              <div className="header-left">
                <Button
                  type="text"
                  icon={<ArrowLeft size={20} />}
                  onClick={onBack}
                  className="back-btn"
                >
                  {t('nav.back')} to {t('nav.dashboard')}
                </Button>
                <div className="farm-info">
                  <h1 className="farm-name">{farm.name}</h1>
                  <p className="farm-location">{farm.location}</p>
                </div>
              </div>
              
              <div className="header-buttons">
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'add-section',
                        label: t('sections.add'),
                        icon: <Plus size={16} />,
                        onClick: handleAddSection,
                      },
                      {
                        key: 'add-device',
                        label: t('sensors.add'),
                        icon: <Plus size={16} />,
                        onClick: handleAddDevice,
                      },
                    ],
                  }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Button
                    type="primary"
                    className="add-section-btn"
                  >
                    {<Plus size={20} />}
                  </Button>
                </Dropdown>
              </div>
            </div>

            <div className="farm-sections__summary">
              <div className="summary-card">
                <h3>{t('sections.title')} Overview</h3>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-number">{sections.length}</span>
                    <span className="stat-label">Total {t('sections.title')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="farm-sections__content">
              <h2 className="sections-title">{t('sections.title')}</h2>
              
              {loading ? (
                <div className="loading-container">
                  <Spin size="large" />
                  <p>{t('common.loading')}</p>
                </div>
              ) : sections.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__content">
                    <img 
                      src="/assets/section_icons/nosectionsfound1.png" 
                      alt="No sections found" 
                      className="empty-state__image"
                    />
                    <h3>{t('sections.empty.title')}</h3>
                    <p>{t('sections.empty.description')}</p>
                  </div>
                </div>
              ) : (
                <div className="sections-grid">
                  {sections.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      onViewDetails={handleSectionDetails}
                      onEdit={handleSectionEdit}
                      onDelete={handleSectionDelete}
                      onAddDevice={handleAssignDevice}
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

      <AddDeviceModal
        isOpen={isAddDeviceModalOpen}
        onClose={handleCloseAddDeviceModal}
        onSubmit={handleSubmitAddDevice}
        loading={addingDeviceLoading}
      />

      <AssignDeviceModal
        isOpen={isAssignDeviceModalOpen}
        onClose={handleCloseAssignDeviceModal}
        onSubmit={handleSubmitAssignDevice}
        sectionId={sectionToAssignDevice?.id || null}
        sectionName={sectionToAssignDevice?.name || null}
        loading={assigningDeviceLoading}
      />

      <EditSectionModal
        isOpen={isEditSectionModalOpen}
        onClose={handleEditSectionModalClose}
        onSubmit={handleEditSectionSubmit}
        section={sectionToEdit}
      />

      <DeleteSectionModal
        isOpen={isDeleteSectionModalOpen}
        onClose={handleDeleteSectionModalClose}
        onConfirm={handleDeleteSectionConfirm}
        section={sectionToDelete}
      />
    </div>
  );
};