import { Car, Maintenance } from '../types';
import { handleApiError } from '../utils/apiErrorHandler';
import { api } from './auth';


export const getCars = async (): Promise<Car[]> => {
  try {
    const response = await api.get('/particulier/my-cars');
    return response.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch cars');
  }
};

export const saveCar = async (carData: Omit<Car, 'id'>, id?: string): Promise<Car> => {
  try {
    const url = id ? `/particulier/my-cars/update-car/${id}` : '/particulier/my-cars/create-car';
    const method = id ? 'put' : 'post';
    const response = await api[method](url, carData);
    return response.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to save car');
  }
};

export const deleteCar = async (id: string): Promise<void> => {
  try {  
    
    await api.delete(`/particulier/my-cars/delete-car/${id}`);
  } catch (error) {
     
    throw handleApiError(error);
  }
};

export const getMaintenances = async (): Promise<Maintenance[]> => {
  try {
    const response = await api.get('/particulier/my-maintenances');
    return response.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch maintenances');
  }
};

export const saveMaintenance = async (
  maintenanceData: Omit<Maintenance, 'id' | 'car'>, 
  id?: string
): Promise<Maintenance> => {
  try {
    const url = id ? `/particulier/my-maintenances/update/${id}` : '/particulier/my-maintenances/create-maintenance';
    const method = id ? 'put' : 'post';
    const response = await api[method](url, maintenanceData);
    return response.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to save maintenance');
  }
};

export const deleteMaintenance = async (id: string): Promise<void> => {
  try {
    await api.delete(`/particulier/my-maintenances/delete/${id}`);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to delete maintenance');
  }
};