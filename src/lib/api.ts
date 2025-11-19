import { API_BASE_URL } from '@/config/env';
import axios from 'axios';
import { clearAllAuth, getAccessToken, setAccessToken, touchRefreshWatcher } from './auth';
import type { StoredUser } from './auth';

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
    status: 'success';
    message: string;
    user: StoredUser;
}

export interface LoginResponse {
    status: 'success';
    message: string;
    accessToken: string;
    refreshToken: string;
    user: StoredUser;
    provider?: 'password' | 'google';
}

export interface RotateTokenResponse {
    status: 'success';
    message: string;
    accessToken: string;
    refreshToken: string;
}

export interface Mailbox {
    id: string;
    name: string;
    unread?: number;
}

export interface MailboxResponse {
    status: 'success';
    data: Mailbox[];
}

export interface EmailListItem {
    id: string;
    mailboxId: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    preview: string;
    timestamp: string;
    starred: boolean;
    unread: boolean;
    important: boolean;
}

export interface MailboxEmailsResponse {
    status: 'success';
    data: EmailListItem[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
    };
}

export interface EmailDetail extends EmailListItem {
    to: string[];
    cc?: string[];
    body: string;
    attachments?: {
        id: string;
        fileName: string;
        size: string;
        type: string;
    }[];
}

export interface EmailDetailResponse {
    status: 'success';
    data: EmailDetail;
}

export const registerUser = async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/user/register', data);
    return response.data;
};

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/user/login', data);
    return response.data;
};

export const loginWithGoogle = async (credential: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/user/google', { credential });
    return response.data;
};

export const rotateTokens = async (refreshToken: string): Promise<RotateTokenResponse> => {
    const response = await apiClient.post<RotateTokenResponse>('/user/refresh', { refreshToken });
    return response.data;
};

export const logoutUser = async (userId: string) => {
    const response = await apiClient.post<{ status: 'success'; message: string }>('/user/logout', { userId });
    return response.data;
};

export const getMailboxes = async (): Promise<MailboxResponse> => {
    const response = await apiClient.get<MailboxResponse>('/mailboxes');
    return response.data;
};

export const getMailboxEmails = async (mailboxId: string, page = 1, pageSize = 20): Promise<MailboxEmailsResponse> => {
    const response = await apiClient.get<MailboxEmailsResponse>(`/mailboxes/${mailboxId}/emails`, {
        params: { page, pageSize },
    });
    return response.data;
};

export const getEmailDetail = async (emailId: string): Promise<EmailDetailResponse> => {
    const response = await apiClient.get<EmailDetailResponse>(`/emails/${emailId}`);
    return response.data;
};

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
        const originalRequest = error.config;
        const url: string = originalRequest?.url ?? '';
        const isAuthEndpoint =
            url.includes('/user/refresh') ||
            url.includes('/user/login') ||
            url.includes('/user/logout') ||
            url.includes('/user/register') ||
            url.includes('/user/google');
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
                const data = await rotateTokens(storedRefresh);
                setAccessToken(data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                touchRefreshWatcher();
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

export default apiClient;
