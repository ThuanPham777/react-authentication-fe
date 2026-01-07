// src/lib/api/client.ts
import axios from 'axios';
import { API_BASE_URL } from '@/config/env';
import {
  clearAllAuth,
  getAccessToken,
  setAccessToken,
  touchRefreshWatcher,
} from '../auth';
import type { RotateTokenResponse } from './types/auth.types';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  pendingRequests.forEach((cb) => cb(token));
  pendingRequests = [];
}

/**
 * Không import rotateTokens từ auth.api để tránh vòng lặp import.
 * Refresh gọi trực tiếp ở đây.
 */
async function performTokenRefresh(refreshToken: string) {
  const response = await apiClient.post<RotateTokenResponse>(
    '/api/auth/refresh',
    {
      refreshToken,
    }
  );
  return response.data;
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as any;
    const url: string = originalRequest?.url ?? '';

    // Don't attempt to refresh for auth endpoints to avoid infinite loops
    const isAuthEndpoint =
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/logout') ||
      url.includes('/api/auth/google'); // includes /google/login

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const storedRefresh = localStorage.getItem('refreshToken');
      if (!storedRefresh) return Promise.reject(error);

      // Nếu đang refresh, xếp hàng
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await performTokenRefresh(storedRefresh);

        setAccessToken(response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        touchRefreshWatcher();

        onRefreshed(response.data.accessToken);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

        return apiClient(originalRequest);
      } catch (e) {
        clearAllAuth();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
