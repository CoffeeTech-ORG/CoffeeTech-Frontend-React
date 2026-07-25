
import { AddFarmData } from '../components/Dashboard/AddFarmModal/AddFarmModal';
import apiClient from './api.client';
import { ringToGeoJsonString } from '../utils/geoBoundary';

export const createFarm = async (data: AddFarmData, userId: number) => {
  // The boundary travels as `[lat, lng]` through the form, but the backend stores it as GeoJSON:
  // converted here, at the boundary, so the rest of the object propagates unchanged.
  const payload = { ...data, userId, boundary: ringToGeoJsonString(data.boundary) };
  const response = await apiClient.post('/farms', payload);
  if (response.status !== 201) {
    throw new Error('Failed to create farm');
  }
  return response.data;
};
