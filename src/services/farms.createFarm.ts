
import { AddFarmData } from '../components/Dashboard/AddFarmModal/AddFarmModal';
import apiClient from './api.client';

export const createFarm = async (data: AddFarmData, userId: number) => {
  const payload = { ...data, userId };
  const response = await apiClient.post('/farms', payload);
  if (response.status !== 201) {
    throw new Error('Failed to create farm');
  }
  return response.data;
};
