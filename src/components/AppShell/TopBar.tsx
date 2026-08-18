import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { LanguageSelector } from '../LanguageSelector';
import { useNavTabs } from './useNavTabs';
import './TopBar.scss';

/**
 * Main navigation.
 *
 * With one to three destinations, a vertical rail spends permanent width for nothing, so there is a
 * top bar instead -- and with it go the side drawer, the hamburger button and its context, three
 * pieces that only existed to hold the rail.
 *
 * On mobile the tabs move to the bottom; the brand and the session stay up top, and the navigation
 * is where the thumb reaches without repositioning the hand. It follows the redesign prototype,
 * which paints it with `position: bottom` despite its README saying "top bar on desktop and mobile".
 *
 * Mounted ONCE, in `AppShell`.
 */
export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isManager = user?.role?.id === 1;

  const tabs = useNavTabs();

  const initials = (user?.username || '?')
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button
          type="button"
          className="topbar__brand"
          onClick={() => navigate('/dashboard')}
          aria-label={t('nav.goHome')}
        >
          CoffeeTech
        </button>

        {/* En móvil se oculta por CSS: las mismas pestañas se pintan abajo, en `BottomNav`. */}
        <nav className="topbar__tabs" aria-label={t('nav.main')}>
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `topbar__tab${isActive ? ' is-active' : ''}`
              }
            >
              {tab.icon}
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="topbar__right">
          <LanguageSelector />

          <div className="topbar__user">
            <button
              type="button"
              className="topbar__user-btn"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <span className="topbar__avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="topbar__user-name">{user?.username}</span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>

            {userMenuOpen && (
              <>
                {/* Cerrar al tocar fuera es el gesto que la gente intenta primero. */}
                <div
                  className="topbar__scrim"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="topbar__menu" role="menu">
                  <div className="topbar__menu-head">
                    <strong>{user?.username}</strong>
                    <span>{isManager ? t('role.manager') : t('role.farmer')}</span>
                  </div>
                  <button
                    type="button"
                    className="topbar__menu-item"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/perfil');
                    }}
                  >
                    <User size={16} />
                    {t('nav.profile')}
                  </button>
                  <button
                    type="button"
                    className="topbar__menu-item"
                    role="menuitem"
                    onClick={logout}
                  >
                    <LogOut size={16} />
                    {t('nav.logout')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
