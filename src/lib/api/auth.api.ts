// src/lib/api/auth.api.ts
import apiClient from './client';
import type { LoginResponse, RotateTokenResponse } from './types';

/**
 * Google OAuth 2.0 Login/Register (Authorization Code flow)
 * Handles both login (existing user) and registration (new user)
 */
export const loginWithGoogle = async (code: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>(
    '/api/auth/google/login',
    { code }
  );
  return response.data;
};

/**
 * Refresh access token using stored refresh token
 * Implements token rotation for security
 */
export const rotateTokens = async (
  refreshToken: string
): Promise<RotateTokenResponse> => {
  const response = await apiClient.post<RotateTokenResponse>(
    '/api/auth/refresh',
    { refreshToken }
  );
  return response.data;
};

/**
 * Logout user and clear server-side refresh token
 */
export const logoutUser = async (userId: string) => {
  const response = await apiClient.post<{ status: 'success'; message: string }>(
    '/api/auth/logout',
    { userId }
  );
  return response.data;
};
