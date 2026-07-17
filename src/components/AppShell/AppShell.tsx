import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import './AppShell.scss';

/**
 * Routes whose view fills the viewport exactly and manages its own scrolling.
 *
 * The panel is a triage screen with a map alongside: scroll the whole page and the map rises and
 * disappears just as you go down the list it serves as reference for. With the frame fixed, only the
 * list moves, inside its column, and the map height comes from the grid instead of by eye.
 *
 * A list and not the default because other views -- sections, reports, hubs -- rely on the page
 * scrolling; forcing them into the viewport would clip them.
 */
const VIEWPORT_FIT = ['/dashboard'];

/**
 * The application frame: a persistent top bar plus the current route's content.
 *
 * Mounted as a layout route, so the bar does NOT remount when navigating between screens. Otherwise
 * each view (`Dashboard`, `FarmSections`, `SectionDetailView`) carries its own copy of the header
 * and side rail -- three implementations of the same header to keep in sync by hand, flickering on
 * every screen change.
 */
export const AppShell: React.FC = () => {
  const { pathname } = useLocation();
  const fitted = VIEWPORT_FIT.includes(pathname);

  return (
    <div className={`app-shell${fitted ? ' is-fitted' : ''}`}>
      <TopBar />
      <main className="app-shell__content">
        <Outlet />
      </main>
      {/* Sólo visible en móvil; ver `BottomNav.scss`. */}
      <BottomNav />
    </div>
  );
};
