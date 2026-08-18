import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { AppShell } from './components/AppShell/AppShell';
import { ManagerOnly } from './components/AppShell/ManagerOnly';
import { FarmListView } from './components/FarmList/FarmListView';
import { FarmSectionsView } from './components/Dashboard/FarmSections/FarmSectionsView';
import { SectionDetailRoute } from './components/SectionData/SectionDetailRoute';
import { Reports } from './components/Reports/Reports';
import { SensorInventory } from './components/SensorInventory/SensorInventory';
import { HubDetailRoute } from './components/SensorInventory/HubDetail/HubDetailRoute';
import { ProfileView } from './components/Profile/ProfileView';
import { AuthWrapper } from './components/AuthWrapper/AuthWrapper';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { Spin } from 'antd';
import './styles/globals.scss';
import './styles/mobile-datepicker.scss';
import './styles/modal-sheet.scss';

// Mirror of the visual system (`styles/variables.scss`). antd paints its own components
// -- modals, selects, date pickers, `Typography` titles -- and without this they keep its palette
// and scale instead of the system's.
//
// Heading sizes matter more than they seem: the Reports title is a `Typography.Title`, so antd set
// its size (24 px, a step that does not exist in the scale) while every other screen used the
// system's 28 px. Mapped here, any `Title` in the app lands on the scale without each view
// correcting it.
const theme = {
  token: {
    colorPrimary: '#24472d',
    colorSuccess: '#3a7d52',
    colorWarning: '#9a6b12',
    colorError: '#b5451f',
    colorTextBase: '#23261f',
    borderRadius: 12,
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeSM: 12.5,
    fontSizeLG: 16,
    fontSizeHeading1: 36,
    fontSizeHeading2: 28,
    fontSizeHeading3: 22,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,
  },
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();


  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <AuthWrapper />
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <AuthWrapper />
        } 
      />
      
      {/*
        Una ruta por vista, todas colgando de `AppShell`.

        Antes sólo existía `/dashboard` y el resto se conmutaba con `useState`, así que la URL
        nunca cambiaba: el botón atrás no retrocedía, F5 devolvía siempre al inicio y no se
        podía compartir un enlace a una finca.

        `AppShell` es una ruta de LAYOUT: la barra superior se monta una sola vez y sobrevive a
        la navegación. Antes cada vista traía su propia copia de la cabecera y del riel.
      */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<FarmListView />} />
        <Route
          path="/reportes"
          element={
            <ManagerOnly>
              <Reports />
            </ManagerOnly>
          }
        />
        {/* El detalle es una ruta HIJA, no hermana. Siendo hermanas, abrir un hub desmontaba
            `SensorInventory` y montaba otra instancia dentro del detalle: `useSensors` volvía a
            pedir los datos y aparecía el esqueleto un instante, a la ida y a la vuelta. Anidada,
            la lista sobrevive a la navegación y el panel se dibuja en su `Outlet`. */}
        <Route
          path="/hubs"
          element={
            <ManagerOnly>
              <SensorInventory />
            </ManagerOnly>
          }
        >
          <Route path=":hubId" element={<HubDetailRoute />} />
        </Route>
        <Route path="/perfil" element={<ProfileView />} />
        <Route path="/fincas/:farmId" element={<FarmSectionsView />} />
        <Route
          path="/fincas/:farmId/secciones/:sectionId"
          element={<SectionDetailRoute />}
        />
      </Route>

      {/* Default redirect */}
      <Route 
        path="/" 
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } 
      />
      
      {/* Catch all - redirect to appropriate page */}
      <Route 
        path="*" 
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntdApp>
        <Router>
          <I18nProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </I18nProvider>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;