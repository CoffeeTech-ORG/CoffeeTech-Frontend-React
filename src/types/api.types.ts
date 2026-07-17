export interface Section {
  id: number | string;
  name: string;
  type: string;
}

export interface Assignment {
  id: number | string;
  sectionId: number | string;
  deviceId: number | string;
  // allow extra fields
  [key: string]: any;
}

export interface Device {
  id: number | string;
  deviceHubId?: number | string | null;
  [key: string]: any;
}

export interface DataRecordRaw {
  id: number | string;
  airHumidityPercent?: number | string;
  celciusGradeTemperature?: number | string; // possible misspelling
  soilHumidityPercent?: number | string;
  precipitationDetected?: boolean | string | number; // Can be 0/1 from API
  nitrogen?: number | string;
  phosphorus?: number | string;
  potassium?: number | string;
  timestamp?: string | number; // optional
  updatedAt?: string; // API field
  [key: string]: any;
}

export interface DataRecord {
  id: number | string;
  airHumidityPercent?: number | null;
  celciusGradeTemperature?: number | null; // API spelling variant
  soilHumidityPercent?: number | null;
  precipitationDetected?: boolean | number | string; // Can be 0 or 1 from API, 1 = rained, 0 = did not rain
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
  timestamp?: string | number | null;
  updatedAt?: string | null;
}

export interface Recommendation {
  id: number | string;
  deviceHubId?: number | string;
  title?: string;
  description?: string;
  recommendationDescription?: string;
  [key: string]: any;
}

// Agronomic log: one record per event in the crop calendar. Append-only -- the cycle repeats by
// recording NEW events, not by reactivating earlier ones. It stores only the date (no product
// catalogue or laboratory values).
export type AgronomicEventType =
  | 'flowering'
  | 'fertilization'
  | 'harvest_end'
  | 'soil_sampling'
  | 'liming';

export interface AgronomicEvent {
  id: number;
  sectionId: number;
  eventType: AgronomicEventType;
  eventDate: string;
  notes?: string | null;
}

export interface ApiResponse<T = any> {
  data: T;
  [key: string]: any;
}
