import React, { useEffect, useRef, useState, useCallback } from 'react';
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

  const isSelectingPlace = useRef(false);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 10;
    
    // Don't reinitialize if autocomplete already exists
    if (autocompleteRef.current && (window as any).google && (window as any).google.maps) {
      return;
    }

    const loadGoogleMapsScript = () => {
      if (!mounted) return;

      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places && (window as any).google.maps.places.Autocomplete) {
        initializeAutocomplete();
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key not found');
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for the existing script to load
        const checkGoogleMaps = () => {
          if (!mounted) return;
          
          if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places && (window as any).google.maps.places.Autocomplete) {
            initializeAutocomplete();
          } else {
            retryCount++;
            if (retryCount < maxRetries) {
              setTimeout(checkGoogleMaps, 200);
            } else {
              console.error('Google Maps API failed to load after multiple attempts');
            }
          }
        };
        checkGoogleMaps();
        return;
      }

      const script = document.createElement('script');
      const callbackName = `initGoogleMaps_${Date.now()}`;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;

      // Create a unique global callback function
      (window as any)[callbackName] = () => {
        if (!mounted) return;
        
        // Wait a bit more to ensure everything is loaded
        setTimeout(() => {
          if (!mounted) return;
          
          if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places && (window as any).google.maps.places.Autocomplete) {
            initializeAutocomplete();
          } else {
            console.error('Google Maps API did not load properly');
          }
          // Clean up the callback
          delete (window as any)[callbackName];
        }, 100);
      };

      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        delete (window as any)[callbackName];
      };

      document.head.appendChild(script);

      return () => {
        mounted = false;
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        // Clean up the global callback
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
        }
      };
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current?.input) {
        setTimeout(() => {
          if (mounted) initializeAutocomplete();
        }, 100);
        return;
      }

      // Double check that Google Maps API is fully loaded
      if (!(window as any).google || !(window as any).google.maps || !(window as any).google.maps.places || !(window as any).google.maps.places.Autocomplete) {
        setTimeout(() => {
          if (mounted) initializeAutocomplete();
        }, 200);
        return;
      }

      try {
        // Clear any existing autocomplete
        if (autocompleteRef.current && (window as any).google.maps.event) {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }

        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(
          inputRef.current.input,
          {
            types: ['geocode'],
            fields: ['place_id', 'formatted_address', 'name', 'geometry']
          }
        );

        // Handle place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.formatted_address) {
            // Set flag to prevent handleInputChange from interfering
            isSelectingPlace.current = true;
            
            // Update React state first
            setInputValue(place.formatted_address);
            
            // Call the parent callbacks immediately using refs
            onPlaceSelectRef.current(place);
            if (onChangeRef.current) {
              onChangeRef.current(place.formatted_address);
            }
            
            // Then update the DOM input to match
            setTimeout(() => {
              if (inputRef.current?.input) {
                const inputElement = inputRef.current.input;
                if (inputElement.value !== place.formatted_address) {
                  inputElement.value = place.formatted_address;
                }
              }
              isSelectingPlace.current = false;
            }, 50);
          }
        });

      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
        // Retry initialization if it failed
        setTimeout(() => {
          if (mounted) initializeAutocomplete();
        }, 1000);
      }
    };

    const cleanup = loadGoogleMapsScript();

    return () => {
      if (autocompleteRef.current && (window as any).google && (window as any).google.maps) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, []); // Remove dependencies to prevent re-initialization

  // Update refs when props change
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
    onChangeRef.current = onChange;
  }, [onPlaceSelect, onChange]);

  useEffect(() => {
    // Only update if value is defined, different from current, and we're not selecting a place
    if (value !== undefined && value !== inputValue && !isSelectingPlace.current) {
      setInputValue(value);
      // Also update the DOM input if it exists and is different
      if (inputRef.current?.input && inputRef.current.input.value !== value) {
        inputRef.current.input.value = value;
      }
    }
  }, [value]); // Remove inputValue dependency to avoid loops

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't handle input change if we're currently selecting a place
    if (isSelectingPlace.current) {
      return;
    }
    
    const newValue = e.target.value;
    
    // Only update if the value is actually different
    if (newValue !== inputValue) {
      setInputValue(newValue);
      if (onChangeRef.current) {
        onChangeRef.current(newValue);
      }
    }
  }, [inputValue]); // Add inputValue dependency to check for changes

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