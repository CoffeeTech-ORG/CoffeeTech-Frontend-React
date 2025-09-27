import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AuthWrapper } from './components/AuthWrapper/AuthWrapper';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { Spin } from 'antd';
import './styles/globals.scss';

const theme = {
  token: {
    colorPrimary: '#20B2AA',
    borderRadius: 8,
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
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
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