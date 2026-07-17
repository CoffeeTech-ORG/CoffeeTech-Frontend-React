import React from 'react';
import { FileText, LayoutGrid, RadioTower } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

export interface NavTab {
  to: string;
  icon: React.ReactNode;
  label: string;
}

/**
 * The navigation destinations, in one place.
 *
 * Rendered in two spots -- top on desktop, bottom on mobile -- and duplicating them would guarantee
 * a tab is added to one and not the other some day.
 *
 * Reports and Hubs are the Manager's. They are not hidden from the Farmer "to simplify": the Farmer
 * has no permission, and offering a tab that bounces them would be a false promise.
 */
export const useNavTabs = (): NavTab[] => {
  const { user } = useAuth();
  const { t } = useI18n();
  const isManager = user?.role?.id === 1;

  return [
    { to: '/dashboard', icon: <LayoutGrid size={19} />, label: t('nav.farms') },
    ...(isManager
      ? [
          { to: '/reportes', icon: <FileText size={19} />, label: t('nav.reports') },
          { to: '/hubs', icon: <RadioTower size={19} />, label: t('nav.hubs') },
        ]
      : []),
  ];
};
