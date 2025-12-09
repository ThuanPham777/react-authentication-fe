// src/lib/api/auth.api.ts
import apiClient from "./client";
import type {
    RegisterData,
    RegisterResponse,
    LoginData,
    LoginResponse,
    RotateTokenResponse,
} from "./types";

export const registerUser = async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>("/api/auth/register", data);
    return response.data;
};

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/api/auth/login", data);
    return response.data;
};

/**
 * One Tap credential flow (nếu bạn vẫn giữ endpoint này)
 */
export const loginWithGoogle = async (credential: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/api/auth/google", { credential });
    return response.data;
};

/**
 * Full login (Code flow + Gmail scopes)
 */
export const loginFullWithGoogle = async (code: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/api/auth/google/full-login", { code });
    return response.data;
};

export const rotateTokens = async (refreshToken: string): Promise<RotateTokenResponse> => {
    const response = await apiClient.post<RotateTokenResponse>("/api/auth/refresh", { refreshToken });
    return response.data;
};

export const logoutUser = async (userId: string) => {
    const response = await apiClient.post<{ status: "success"; message: string }>(
        "/api/auth/logout",
        { userId }
    );
    return response.data;
};
