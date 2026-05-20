import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type { APIResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add staff ID from localStorage
apiClient.interceptors.request.use((config) => {
  const staffId = localStorage.getItem('staffId');
  if (staffId) {
    config.headers['x-staff-id'] = staffId;
  }
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? '';
    if (error.response?.status === 401 && !url.includes('patient-auth')) {
      localStorage.removeItem('staffId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API call function
export async function apiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: unknown
): Promise<APIResponse<T>> {
  try {
    const response = await apiClient({
      method,
      url,
      data,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
