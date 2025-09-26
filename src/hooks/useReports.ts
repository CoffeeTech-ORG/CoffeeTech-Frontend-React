import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { ReportData, ReportFilters, ReportSummary, ChartDataPoint } from '../types/report.types';
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

  // Get report summary from backend
  const getReportSummary = useCallback(async (filters: ReportFilters): Promise<ReportSummary> => {
    try {
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

      const response = await api.get(`${API_ENDPOINTS.REPORTS_SUMMARY}?${params}`);
      
      // Transform backend response to frontend format
      const backendSummary = response.data;
      return {
        totalDataPoints: backendSummary.recordCount,
        averageTemperature: backendSummary.environmental?.averageTemperature,
        averageAirHumidity: backendSummary.environmental?.averageAirHumidity,
        averageSoilHumidity: backendSummary.environmental?.averageSoilHumidity,
        precipitationDays: backendSummary.environmental?.precipitationDays || 0,
        averageNitrogen: backendSummary.nutrients?.averageNitrogen,
        averagePhosphorus: backendSummary.nutrients?.averagePhosphorus,
        averagePotassium: backendSummary.nutrients?.averagePotassium,
        healthScore: calculateHealthScore([]) // You can implement this or get it from backend
      };
    } catch (error) {
      console.error('Error fetching report summary:', error);
      throw error;
    }
  }, []);

  // Generate report summary from data (fallback)
  const generateReportSummary = useCallback((data: ReportData[]): ReportSummary => {
    if (data.length === 0) {
      return {
        totalDataPoints: 0,
        precipitationDays: 0
      };
    }

    const validTemperatures = data.filter(d => d.celsiusGradeTemperature !== null && d.celsiusGradeTemperature !== undefined);
    const validAirHumidity = data.filter(d => d.airHumidityPercent !== null && d.airHumidityPercent !== undefined);
    const validSoilHumidity = data.filter(d => d.soilHumidityPercent !== null && d.soilHumidityPercent !== undefined);
    const validNitrogen = data.filter(d => d.nitrogen !== null && d.nitrogen !== undefined);
    const validPhosphorus = data.filter(d => d.phosphorus !== null && d.phosphorus !== undefined);
    const validPotassium = data.filter(d => d.potassium !== null && d.potassium !== undefined);

    const precipitationDays = data.filter(d => d.precipitationDetected === true).length;

    return {
      totalDataPoints: data.length,
      averageTemperature: validTemperatures.length > 0 
        ? validTemperatures.reduce((sum, d) => sum + (d.celsiusGradeTemperature || 0), 0) / validTemperatures.length 
        : undefined,
      averageAirHumidity: validAirHumidity.length > 0
        ? validAirHumidity.reduce((sum, d) => sum + (d.airHumidityPercent || 0), 0) / validAirHumidity.length
        : undefined,
      averageSoilHumidity: validSoilHumidity.length > 0
        ? validSoilHumidity.reduce((sum, d) => sum + (d.soilHumidityPercent || 0), 0) / validSoilHumidity.length
        : undefined,
      precipitationDays,
      averageNitrogen: validNitrogen.length > 0
        ? validNitrogen.reduce((sum, d) => sum + (d.nitrogen || 0), 0) / validNitrogen.length
        : undefined,
      averagePhosphorus: validPhosphorus.length > 0
        ? validPhosphorus.reduce((sum, d) => sum + (d.phosphorus || 0), 0) / validPhosphorus.length
        : undefined,
      averagePotassium: validPotassium.length > 0
        ? validPotassium.reduce((sum, d) => sum + (d.potassium || 0), 0) / validPotassium.length
        : undefined,
      healthScore: calculateHealthScore(data)
    };
  }, []);

  // Transform data for charts
  const prepareChartData = useCallback((data: ReportData[]): ChartDataPoint[] => {
    return data.map(item => ({
      timestamp: typeof item.timestamp === 'string' ? item.timestamp : item.timestamp.toISOString(),
      date: dayjs(item.timestamp).format('MM/DD'),
      temperature: item.celsiusGradeTemperature || undefined,
      airHumidity: item.airHumidityPercent || undefined,
      soilHumidity: item.soilHumidityPercent || undefined,
      nitrogen: item.nitrogen || undefined,
      phosphorus: item.phosphorus || undefined,
      potassium: item.potassium || undefined,
      precipitation: item.precipitationDetected ? 1 : 0
    }));
  }, []);

  return {
    loading,
    error,
    getFarms,
    getSectionsByFarm,
    generateReport,
    getReportSummary,
    generateReportSummary,
    prepareChartData
  };
};

// Helper function to calculate health score based on various metrics
function calculateHealthScore(data: ReportData[]): number {
  if (data.length === 0) return 0;

  let score = 100;
  const validData = data.filter(d => 
    d.celsiusGradeTemperature !== null || 
    d.airHumidityPercent !== null || 
    d.soilHumidityPercent !== null
  );

  if (validData.length === 0) return 50; // Default score

  // Temperature score (optimal range: 18-25°C for coffee)
  const temperatures = validData.filter(d => d.celsiusGradeTemperature !== null);
  if (temperatures.length > 0) {
    const avgTemp = temperatures.reduce((sum, d) => sum + (d.celsiusGradeTemperature || 0), 0) / temperatures.length;
    if (avgTemp < 15 || avgTemp > 30) score -= 20;
    else if (avgTemp < 18 || avgTemp > 25) score -= 10;
  }

  // Humidity scores
  const airHumidity = validData.filter(d => d.airHumidityPercent !== null);
  if (airHumidity.length > 0) {
    const avgAirHum = airHumidity.reduce((sum, d) => sum + (d.airHumidityPercent || 0), 0) / airHumidity.length;
    if (avgAirHum < 60 || avgAirHum > 90) score -= 15;
    else if (avgAirHum < 70 || avgAirHum > 80) score -= 5;
  }

  const soilHumidity = validData.filter(d => d.soilHumidityPercent !== null);
  if (soilHumidity.length > 0) {
    const avgSoilHum = soilHumidity.reduce((sum, d) => sum + (d.soilHumidityPercent || 0), 0) / soilHumidity.length;
    if (avgSoilHum < 40 || avgSoilHum > 80) score -= 15;
    else if (avgSoilHum < 50 || avgSoilHum > 70) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

