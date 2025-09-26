import { Dayjs } from 'dayjs';

export interface ReportData {
  id: string | number;
  timestamp: string | Date;
  sectionId: string | number;
  sectionName: string;
  farmId: string | number;
  farmName: string;
  // Sensor data
  airHumidityPercent?: number | null;
  celciusGradeTemperature?: number | null;
  soilHumidityPercent?: number | null;
  precipitationDetected?: boolean;
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
}

export interface ReportFilters {
  farmId?: string | number | null;
  sectionId?: string | number | null;
  startDate?: Dayjs | null;
  endDate?: Dayjs | null;
  dataType?: 'all' | 'environmental' | 'soil' | 'nutrients';
}

export interface ReportSummary {
  totalDataPoints: number;
  averageTemperature?: number;
  averageAirHumidity?: number;
  averageSoilHumidity?: number;
  precipitationDays: number;
  averageNitrogen?: number;
  averagePhosphorus?: number;
  averagePotassium?: number;
  healthScore?: number;
}

export interface ChartDataPoint {
  timestamp: string;
  date: string;
  temperature?: number;
  airHumidity?: number;
  soilHumidity?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  precipitation?: boolean | number;
}

export interface ReportExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeCharts: boolean;
  includeSummary: boolean;
}