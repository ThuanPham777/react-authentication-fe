import { API_BASE_URL } from '@/config/env';
import axios from 'axios';
import { getAccessToken, setAccessToken, clearAllAuth } from './auth';


const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach access token if present
apiClient.interceptors.request.use((config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
    pendingRequests.forEach((cb) => cb(token));
    pendingRequests = [];
}

apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;
        const url: string = originalRequest?.url ?? '';
        // Do not try to refresh for auth endpoints themselves
        const isAuthEndpoint =
            url.includes('/user/refresh') ||
            url.includes('/user/login') ||
            url.includes('/user/logout') ||
            url.includes('/user/register');
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;
            const storedRefresh = localStorage.getItem('refreshToken');
            if (!storedRefresh) return Promise.reject(error);

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
                const data = await refreshToken(storedRefresh);
                setAccessToken(data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                onRefreshed(data.accessToken);
                originalRequest.headers = originalRequest.headers ?? {};
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
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

export interface RegisterData {
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterResponse {
    status: 'success';
    message: string;
    user: {
        _id: string;
        email: string;
    };
}

export interface LoginResponse {
    status: 'success';
    message: string;
    accessToken: string;
    refreshToken: string;
    user: {
        _id: string;
        email: string;
    };
}

export const registerUser = async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/user/register', data);
    return response.data;
};

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/user/login', data);
    return response.data;
};

export const refreshToken = async (refreshToken: string) => {
    const response = await apiClient.post<{ status: 'success'; message: string; accessToken: string; refreshToken: string }>(
        '/user/refresh',
        { refreshToken },
    );
    return response.data;
};

export const logoutUser = async (userId: string) => {
    const response = await apiClient.post<{ status: 'success'; message: string }>('/user/logout', { userId });
    return response.data;
};

export default apiClient;
