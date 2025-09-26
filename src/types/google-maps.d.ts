declare namespace google {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    namespace geometry {
      class Location {
        lat: number;
        lng: number;
      }
    }

    namespace places {
      class Autocomplete {
        constructor(
          inputField: HTMLInputElement,
          opts?: AutocompleteOptions
        );
        addListener(eventName: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }

      interface AutocompleteOptions {
        types?: string[];
        fields?: string[];
      }

      interface PlaceResult {
        place_id?: string;
        formatted_address?: string;
        name?: string;
        geometry?: {
          location?: LatLng;
          viewport?: any;
        };
      }
    }

    namespace event {
      function clearInstanceListeners(instance: any): void;
    }
  }
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};