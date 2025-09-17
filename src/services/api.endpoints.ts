// API Endpoints Constants
const BASE_URL = 'https://coffeetech-netcoreappweb-f6hwc3fph9hndhhg.centralus-01.azurewebsites.net/api/v1';

export const API_ENDPOINTS = {
  // Authentication
  AUTHENTICATION: `${BASE_URL}/authentication`,
  
  // Farms
  FARMS: `${BASE_URL}/farms`,
  
  // Users (for farm by user)
  USERS: `${BASE_URL}/users`,
  
  // Sections
  SECTIONS: `${BASE_URL}/sections`,
  SECTIONS_BY_FARM: `${BASE_URL}/farms/`, // Note: append farm ID
  
  // Data Records
  DATA_RECORDS: `${BASE_URL}/data-records`,
  
  // Assignments
  ASSIGNMENTS: `${BASE_URL}/assignments`,
  
  // Devices
  DEVICES: `${BASE_URL}/devices`,
  
  // Recommendations
  RECOMMENDATIONS: `${BASE_URL}/recommendations`,
} as const;

export default API_ENDPOINTS;