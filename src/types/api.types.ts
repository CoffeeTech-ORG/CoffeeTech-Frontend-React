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
  dataRecordId?: number | string | null;
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
  precipitationDetected?: boolean | number | string; // Can be 0 or 1 from API, 0 = Sí llovió, 1 = No llovió
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

export interface ApiResponse<T = any> {
  data: T;
  [key: string]: any;
}
