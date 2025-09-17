import React from 'react';
import './Logo.scss';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const sizeClass = `logo--${size}`;
  
  return (
    <div className={`logo ${sizeClass}`}>
      <div className="logo__icon">
        <span className="logo__text">☕</span>
      </div>
      {showText && (
        <span className="logo__brand">
          <span className="logo__brand-main">Coffee</span>
          <span className="logo__brand-sub">Tech</span>
        </span>
      )}
    </div>
  );
};