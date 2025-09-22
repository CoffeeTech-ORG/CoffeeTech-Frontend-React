// API Endpoints Constants
const BASE_URL = import.meta.env.VITE_BACKEND_SERVICE_URL;

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