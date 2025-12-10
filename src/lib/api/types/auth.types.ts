// src/lib/api/types/auth.types.ts
import type { StoredUser } from "../../auth";

export interface RegisterData {
    email: string;
    password: string;
    name?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterResponse {
    status: "success";
    message: string;
    user: StoredUser;
}

export interface LoginResponse {
    status: "success";
    message: string;
    accessToken: string;
    refreshToken: string;
    user: StoredUser;
    provider?: "password" | "google";
}

export interface RotateTokenResponse {
    status: "success";
    message: string;
    accessToken: string;
    refreshToken: string;
}
