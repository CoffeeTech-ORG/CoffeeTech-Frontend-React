import axios from 'axios';
import API_ENDPOINTS from './api.endpoints';

const BASE_URL = API_ENDPOINTS.ASSIGNMENTS.replace('/assignments', '');

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// interceptor to inject Authorization header
api.interceptors.request.use((config) => {
  // ensure headers object exists and satisfy TS by casting
  if (!config.headers) (config as any).headers = {};
  if (authToken) {
    (config as any).headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default api;

// Simple fetch wrapper example (uses global fetch)
export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {})
  } as Record<string, string>;

  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  try {
    const res = await fetch(input, { ...init, headers });
    
    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`;
      try {
        const errorData = await res.text();
        if (errorData) {
          errorMessage += `: ${errorData}`;
        }
      } catch (e) {
        // If we can't parse error, use status
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Handle empty responses (e.g., DELETE operations)
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    } else {
      return null; // For operations that don't return JSON
    }
  } catch (error) {
    console.error('API Request failed:', {
      url: input,
      method: init.method || 'GET',
      headers,
      error
    });
    throw error;
  }
}
