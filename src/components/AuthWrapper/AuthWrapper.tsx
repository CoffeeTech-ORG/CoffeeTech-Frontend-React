import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Login } from '../Auth/Login';
import { Register } from '../Auth/Register';

export const AuthWrapper: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isLogin = location.pathname === '/login';

  const switchToRegister = () => navigate('/register');
  const switchToLogin = () => navigate('/login');

  return isLogin ? (
    <Login onSwitchToRegister={switchToRegister} />
  ) : (
    <Register onSwitchToLogin={switchToLogin} />
  );
};