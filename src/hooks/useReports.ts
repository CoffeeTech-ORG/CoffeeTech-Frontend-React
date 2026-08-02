import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { ReportData, ReportFilters, ChartDataPoint } from '../types/report.types';
import { Farm, Section, useFarms } from './useFarms';
import { api } from '../services/api.service';
import { API_ENDPOINTS } from '../services/api.endpoints';

export const useReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getFarms: getExistingFarms, getFarmSections } = useFarms();

  // Get all farms for filters using existing useFarms hook (respects user roles)
  const getFarms = useCallback(async (): Promise<Farm[]> => {
    try {
      return await getExistingFarms();
    } catch (error) {
      console.error('Error fetching farms:', error);
      throw error;
    }
  }, [getExistingFarms]);

  // Get sections for a specific farm using existing useFarms hook
  const getSectionsByFarm = useCallback(async (farmId: string): Promise<Section[]> => {
    try {
      return await getFarmSections(farmId);
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    }
  }, [getFarmSections]);

  // Generate report data based on filters
  const generateReport = useCallback(async (filters: ReportFilters): Promise<ReportData[]> => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters matching backend expectations
      const params = new URLSearchParams();
      
      if (filters.farmId) {
        params.append('farmId', filters.farmId.toString());
      }
      
      if (filters.sectionId) {
        params.append('sectionId', filters.sectionId.toString());
      }
      
      if (filters.startDate) {
        params.append('startDate', filters.startDate.format('YYYY-MM-DD'));
      }
      
      if (filters.endDate) {
        params.append('endDate', filters.endDate.format('YYYY-MM-DD'));
      }

      if (filters.dataType && filters.dataType !== 'all') {
        params.append('dataType', filters.dataType);
      }

      // Call real API endpoint
      const response = await api.get(`${API_ENDPOINTS.REPORTS_DATA}?${params}`);
      return response.data;
    } catch (error) {
      setError('Error generating report data');
      console.error('Error generating report:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Transform data for charts
  const prepareChartData = useCallback((data: ReportData[]): ChartDataPoint[] => {
    // Chronological order by the instant, not by position in the response. A `.reverse()` is only
    // correct if the backend always returns in exact reverse order, and the chart's point reduction
    // requires a genuinely sorted series.
    const sortedData = [...data].sort(
      (a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf()
    );

    return sortedData.map(item => ({
      timestamp: typeof item.timestamp === 'string' ? item.timestamp : item.timestamp.toISOString(),
      t: dayjs(item.timestamp).valueOf(),
      // Readable, for the tooltip. The X axis is positioned with `t`.
      date: dayjs(item.timestamp).format('DD/MM HH:mm'),
      temperature: (item as any).celsiusGradeTemperature ?? item.celciusGradeTemperature ?? undefined,
      airHumidity: item.airHumidityPercent ?? undefined,
      soilHumidity: item.soilHumidityPercent ?? undefined,
      nitrogen: item.nitrogen ?? undefined,
      phosphorus: item.phosphorus ?? undefined,
      potassium: item.potassium ?? undefined,
      // precipitationDetected: 1 = rained (draw 1), 0 = did not rain (draw 0)
      precipitation: (
        item.precipitationDetected === true ||
        item.precipitationDetected === 1 ||
        item.precipitationDetected === '1'
      ) ? 1 : 0
    }));
  }, []);

  return {
    loading,
    error,
    getFarms,
    getSectionsByFarm,
    generateReport,
    prepareChartData
  };
};

