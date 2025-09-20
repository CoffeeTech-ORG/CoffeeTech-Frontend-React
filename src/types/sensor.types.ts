export interface Sensor {
  id: number;
  sensorCode: string;
  type: SensorType;
  location: string;
  status: SensorStatus;
  lastSeen: string;
}

export type SensorType = 
  | 'COMBINED'
  | 'TEMPERATURE'
  | 'HUMIDITY'
  | 'SOIL_MOISTURE'
  | 'LIGHT'
  | 'PH'
  | 'CONDUCTIVITY';

export type SensorStatus = 
  | 'ACTIVE'
  | 'INACTIVE'
  | 'MAINTENANCE'
  | 'ERROR';

export interface SensorFormData {
  sensorCode: string;
  type: SensorType;
  location: string;
  status: SensorStatus;
}

export interface SensorFilters {
  status?: SensorStatus;
  type?: SensorType;
  location?: string;
  searchTerm?: string;
}

export interface SensorStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  error: number;
}