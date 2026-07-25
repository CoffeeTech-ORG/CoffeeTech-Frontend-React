import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { PlaceResult, searchPlaces } from '../../services/geocoding.service';
import { useI18n } from '../../contexts/I18nContext';
import './PlaceSearch.scss';

interface PlaceSearchProps {
  value: string;
  /** On TYPING only. Never fires when choosing a suggestion. */
  onChange: (text: string) => void;
  /** On CHOOSING a suggestion only. */
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

const DEBOUNCE_MS = 300;

/**
 * Place search over Photon.
 *
 * The two events are mutually exclusive: typing emits `onChange`, choosing emits `onPlaceSelect`,
 * never both. `GooglePlacesAutocomplete` (paid, and dropped) fired `onPlaceSelect` and immediately
 * `onChange` with the same text, and that echo erased the coordinate just received, so consumers had
 * to guard against it with a flag.
 */
export const PlaceSearch: React.FC<PlaceSearchProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  disabled,
}) => {
  const { t } = useI18n();
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  /**
   * Only what the user TYPES is searched.
   *
   * Without this, opening "edit farm" arrives with the field filled from the saved location, the
   * effect searches it on its own, and touching the field brings up a list of suggestions nobody
   * asked for, covering the farm's map. Choosing a suggestion also fills the field, which would fire
   * a search of the text just chosen.
   */
  const userTyped = useRef(false);

  useEffect(() => {
    if (!userTyped.current) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const results = await searchPlaces(value, controller.signal);
      if (!controller.signal.aborted) {
        setSuggestions(results);
        setHighlighted(-1);
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [value]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const choose = useCallback(
    (place: PlaceResult) => {
      userTyped.current = false;
      setOpen(false);
      setSuggestions([]);
      onPlaceSelect(place);
    },
    [onPlaceSelect]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      choose(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="place-search">
      <div className="place-search__field">
        <Search size={16} className="place-search__icon" aria-hidden="true" />
        <input
          type="text"
          className="place-search__input"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-autocomplete="list"
          onChange={(e) => {
            userTyped.current = true;
            onChange(e.target.value);
            setOpen(true);
          }}
          // On focus the list only reopens if there is something to show; if the field arrives
          // filled from the saved farm, nothing is searched.
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          // The close is delayed: without it, the `blur` on clicking a suggestion unmounts it
          // before the click registers.
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
        />
        {loading && (
          <Loader2 size={15} className="place-search__spinner" aria-hidden="true" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="place-search__list" role="listbox">
          {suggestions.map((place, i) => (
            <li key={`${place.latitude},${place.longitude},${i}`} role="option" aria-selected={i === highlighted}>
              <button
                type="button"
                className={`place-search__option${i === highlighted ? ' is-highlighted' : ''}`}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => choose(place)}
              >
                <span className="place-search__label">{place.label}</span>
                {/* Provincia, distrito y pueblo homónimos comparten texto: sin esto son tres
                    opciones idénticas en pantalla. */}
                {place.kind && <span className="place-search__kind">{place.kind}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && value.trim().length >= 3 && suggestions.length === 0 && (
        <p className="place-search__empty">{t('farm.location.noResults')}</p>
      )}
    </div>
  );
};
