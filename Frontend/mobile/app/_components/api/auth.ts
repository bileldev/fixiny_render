import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { LoginResponse } from '../types';


const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'x-client-type': 'mobile'
  },
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = async (userData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
}) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('Attempting login with:', email);
    const response = await api.post('/auth/login', { email, password });
    
    console.log('Login response received:', {
      token: response.data.token,
      user: response.data.user
    });

    // Debug token
    if (typeof response.data.token !== 'string') {
      console.error('Token is not a string:', response.data.token);
      throw new Error('Invalid token format');
    }

    // Debug user
    try {
      const userString = JSON.stringify(response.data.user);
      console.log('User stringified successfully:', userString);
    } catch (e) {
      console.error('Failed to stringify user:', e);
      throw new Error('Invalid user data format');
    }

    await SecureStore.setItemAsync('token', response.data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
    
    console.log('Values stored in SecureStore successfully');
    return response.data;
  } catch (error) {
    console.error('Login error details:', {
      error,
      isAxiosError: axios.isAxiosError(error),
      responseData: axios.isAxiosError(error) ? error.response?.data : null,
      responseStatus: axios.isAxiosError(error) ? error.response?.status : null
    });
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

export const verifySession = async () => {
  try {
    const response = await api.get('/auth/verify');
    return response.data;
  } catch (error) {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
};