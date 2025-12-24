// src/lib/api/types/auth.types.ts
import type { StoredUser } from '../../auth';

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterResponseData {
  user: StoredUser;
}

export interface RegisterResponse {
  status: 'success';
  message?: string;
  data: RegisterResponseData;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
  provider?: 'password' | 'google';
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
