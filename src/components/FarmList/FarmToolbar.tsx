import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { FarmTier } from '../../hooks/useFarmOverview';
import { useI18n } from '../../contexts/I18nContext';
import './FarmToolbar.scss';

export type TierFilter = FarmTier | 'all';

interface FarmToolbarProps {
  counts: Record<FarmTier, number>;
  total: number;
  filter: TierFilter;
  onFilter: (f: TierFilter) => void;
  query: string;
  onQuery: (q: string) => void;
  searchOpen: boolean;
  onSearchOpen: (open: boolean) => void;
}

/** Urgency order, the same as the list. */
const TIERS: FarmTier[] = ['crop', 'device', 'setup', 'ok'];

/**
 * Filter by group and search by name, in the row that heads the list. They solve different
 * problems: the filter narrows today's work ("show only what needs attention"), the search goes
 * to a specific farm you already know.
 *
 * So the search IGNORES the filter: "Cedros" while in "Need attention" must still find it, or the
 * farm looks nonexistent when the honest answer is "it exists, in another group". Groups with no
 * farm are not offered: a filter that can only return zero is a trap.
 */
export const FarmToolbar: React.FC<FarmToolbarProps> = ({
  counts,
  total,
  filter,
  onFilter,
  query,
  onQuery,
  searchOpen,
  onSearchOpen,
}) => {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);

  // Opening the search and then having to click the field again would be one step too many.
  useEffect(() => {
    if (searchOpen) input.current?.focus();
  }, [searchOpen]);

  const cerrar = () => {
    onQuery('');
    onSearchOpen(false);
  };

  return (
    <div className="farm-toolbar">
      {searchOpen ? (
        <div className="farm-toolbar__search">
          <Search size={16} aria-hidden="true" />
          <input
            ref={input}
            type="search"
            className="farm-toolbar__input"
            value={query}
            placeholder={t('farm.search.placeholder')}
            aria-label={t('farm.search.label')}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') cerrar();
            }}
          />
          <button
            type="button"
            className="farm-toolbar__close"
            onClick={cerrar}
            aria-label={t('farm.search.close')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <>
          <div className="farm-toolbar__filters" role="group" aria-label={t('farm.filter.label')}>
            <button
              type="button"
              className={`farm-toolbar__chip${filter === 'all' ? ' is-active' : ''}`}
              onClick={() => onFilter('all')}
              aria-pressed={filter === 'all'}
            >
              {t('farm.filter.all')}
              <span className="farm-toolbar__count">{total}</span>
            </button>

            {TIERS.filter((tier) => counts[tier] > 0).map((tier) => (
              <button
                key={tier}
                type="button"
                className={`farm-toolbar__chip is-${tier}${filter === tier ? ' is-active' : ''}`}
                onClick={() => onFilter(tier)}
                aria-pressed={filter === tier}
              >
                {t(`farm.tier.${tier}`)}
                <span className="farm-toolbar__count">{counts[tier]}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="farm-toolbar__search-btn"
            onClick={() => onSearchOpen(true)}
            aria-label={t('farm.search.label')}
          >
            <Search size={18} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
};
