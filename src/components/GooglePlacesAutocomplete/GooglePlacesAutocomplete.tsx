import React, { useEffect, useRef, useState } from 'react';
import { Input } from 'antd';

// Definiciones de tipos para Google Maps Places API
declare global {
  interface Window {
    google: any;
  }
}

interface PlaceResult {
  place_id?: string;
  formatted_address?: string;
  name?: string;
  geometry?: {
    location?: any;
    viewport?: any;
  };
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  onPlaceSelect,
  placeholder = "Enter location",
  size = "large",
  className = "form-input",
  value,
  onChange
}) => {
  const inputRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        initializeAutocomplete();
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key not found');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeAutocomplete();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
      };

      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current?.input) return;

      try {
        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(
          inputRef.current.input,
          {
            types: ['geocode'],
            fields: ['place_id', 'formatted_address', 'name', 'geometry']
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.formatted_address) {
            setInputValue(place.formatted_address);
            onPlaceSelect(place);
            if (onChange) {
              onChange(place.formatted_address);
            }
          }
        });
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      }
    };

    loadGoogleMapsScript();

    return () => {
      if (autocompleteRef.current && (window as any).google) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onPlaceSelect, onChange]);

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder}
      size={size}
      className={className}
      value={inputValue}
      onChange={handleInputChange}
    />
  );
};