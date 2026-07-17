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
  celciusGradeTemperature?: number | null; // Old spelling variant (with 'c')
  celsiusGradeTemperature?: number | null; // Correct spelling (with 's') - from backend
  soilHumidityPercent?: number | null;
  precipitationDetected?: boolean | number | string; // 1 = rained, 0 = did not rain
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

export interface ChartDataPoint {
  timestamp: string;
  /**
   * The instant in milliseconds. The REAL X axis of the chart.
   *
   * With `date` -- an already-formatted string -- recharts spaced the points at equal intervals
   * without looking at time: two days of readings visually filled the thirty of the requested range,
   * and a week-long gap did not look like a gap.
   */
  t: number;
  /** For the tooltip and labels only: readable, but no use for positioning. */
  date: string;
  temperature?: number;
  airHumidity?: number;
  soilHumidity?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  precipitation?: boolean | number;
}