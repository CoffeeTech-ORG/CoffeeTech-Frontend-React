import React from 'react';
import './Logo.scss';
import logoImg from '../../assets/app_icon/logo.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const sizeClass = `logo--${size}`;
  
  return (
    <div className={`logo ${sizeClass}`}>
      <div className="logo__icon">
        <img src={logoImg} alt="CoffeeTech logo" className="logo__img" />
      </div>
    </div>
  );
};