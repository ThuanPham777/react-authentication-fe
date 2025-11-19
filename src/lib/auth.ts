let accessTokenMemory: string | null = null;
let accessExpiryTimer: number | null = null;
let refreshExpiryTimer: number | null = null;

function decodeJwtExp(token: string | null): number | null {
    try {
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1] || ''));
        if (typeof payload.exp === 'number') return payload.exp * 1000;
        return null;
    } catch {
        return null;
    }
}

function clearTimer(timerId: number | null) {
    if (timerId) window.clearTimeout(timerId);
}

function scheduleAccessExpiryWatcher() {
    clearTimer(accessExpiryTimer);
    const accessExpMs = decodeJwtExp(accessTokenMemory);
    const hasRefresh = Boolean(localStorage.getItem('refreshToken'));
    if (!accessExpMs) return;
    const delay = Math.max(0, accessExpMs - Date.now());
    accessExpiryTimer = window.setTimeout(() => {
        // If no refresh token is present (or already cleared), logout immediately
        if (!hasRefresh) {
            clearAllAuth();
            if (window.location.pathname !== '/login') window.location.assign('/login');
        }
        // If refresh exists, we let the interceptor handle refresh on next API call
    }, delay);
}

function scheduleRefreshExpiryWatcher() {
    clearTimer(refreshExpiryTimer);
    const refreshToken = localStorage.getItem('refreshToken');
    const refreshExpMs = decodeJwtExp(refreshToken);
    if (!refreshExpMs) return;
    const delay = Math.max(0, refreshExpMs - Date.now());
    refreshExpiryTimer = window.setTimeout(() => {
        // Refresh token expired -> force logout immediately
        clearAllAuth();
        if (window.location.pathname !== '/login') window.location.assign('/login');
    }, delay);
}

export const getAccessToken = () => accessTokenMemory;
export const setAccessToken = (token: string | null) => {
    accessTokenMemory = token;
    scheduleAccessExpiryWatcher();
};

export const persistRefreshInfo = (user: { _id: string; email: string }, refreshToken: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('refreshToken', refreshToken);
    scheduleRefreshExpiryWatcher();
};

export const clearAllAuth = () => {
    accessTokenMemory = null;
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    clearTimer(accessExpiryTimer);
    clearTimer(refreshExpiryTimer);
    accessExpiryTimer = null;
    refreshExpiryTimer = null;
};

export const initAuthWatchers = () => {
    scheduleAccessExpiryWatcher();
    scheduleRefreshExpiryWatcher();
};


