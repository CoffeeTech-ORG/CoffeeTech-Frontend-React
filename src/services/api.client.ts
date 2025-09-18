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

  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}
