import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { useNavTabs } from './useNavTabs';
import './BottomNav.scss';

/**
 * Mobile navigation, at the bottom of the screen.
 *
 * On a phone the top is the hardest to reach: the hand has to be repositioned. At the bottom the
 * thumb reaches without letting go of the device, which is how it is held working in the field.
 *
 * The CSS hides it on desktop, where the tabs live in the top bar. Both share `useNavTabs`, so
 * adding a destination updates them together.
 */
export const BottomNav: React.FC = () => {
  const { t } = useI18n();
  const tabs = useNavTabs();

  // With one destination there is nothing to switch: the bar would only take screen from the
  // Farmer to repeat where they are.
  if (tabs.length < 2) return null;

  return (
    <nav className="bottom-nav" aria-label={t('nav.main')}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `bottom-nav__tab${isActive ? ' is-active' : ''}`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
