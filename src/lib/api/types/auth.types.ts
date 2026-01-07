// src/lib/api/types/auth.types.ts
import type { StoredUser } from '../../auth';

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
  provider: 'google';
  isNewUser?: boolean;
}

export interface LoginResponse {
  status: 'success';
  message?: string;
  data: LoginResponseData;
}

export interface RotateTokenResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface RotateTokenResponse {
  status: 'success';
  message?: string;
  data: RotateTokenResponseData;
}
