import React from 'react';
import './Logo.scss';
import logoImg from '/assets/app_icon/logo.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  /** The name beside the icon. Off where the brand is already stated around it. */
  withName?: boolean;
}

/**
 * The brand: icon and name.
 *
 * `Logo.scss` styles `logo__brand`, so the name renders beside the icon. It matters most on the
 * sign-in screen: it is the first thing seen and there is no top bar yet to say what the app is
 * called.
 */
export const Logo: React.FC<LogoProps> = ({ size = 'medium', withName = false }) => (
  <div className={`logo logo--${size}`}>
    <div className="logo__icon">
      <img src={logoImg} alt={withName ? '' : 'CoffeeTech'} className="logo__img" />
    </div>
    {withName && <span className="logo__brand">CoffeeTech</span>}
  </div>
);
