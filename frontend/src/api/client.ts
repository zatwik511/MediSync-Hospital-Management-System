import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type { APIResponse } from '../types';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  throw new Error('[MediSync] VITE_API_URL is not set. The app cannot start in production without an explicit API URL.');
}
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: API_TIMEOUT,
  withCredentials: true, // send httpOnly JWT cookie on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? '';
    if (error.response?.status === 401 && !url.includes('patient-auth')) {
      localStorage.removeItem('staffId');
      localStorage.removeItem('staffName');
      localStorage.removeItem('staffRole');
      localStorage.removeItem('staffCode');
      localStorage.removeItem('lastLogin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function apiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: unknown
): Promise<APIResponse<T>> {
  try {
    const response = await apiClient({ method, url, data });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}
