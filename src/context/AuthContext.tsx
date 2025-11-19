import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    clearAllAuth,
    getStoredUser,
    initAuthWatchers,
    setAccessToken,
    setStoredUser,
    touchRefreshWatcher,
} from '@/lib/auth';
import type { StoredUser } from '@/lib/auth';
import { logoutUser, rotateTokens } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextValue {
    user: StoredUser | null;
    bootstrapped: boolean;
    setUser: (user: StoredUser | null) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const queryClient = useQueryClient();
    const [user, setUserState] = useState<StoredUser | null>(() => getStoredUser());
    const [bootstrapped, setBootstrapped] = useState(false);

    const syncUserFromStorage = useCallback(() => {
        setUserState(getStoredUser());
    }, []);

    useEffect(() => {
        let mounted = true;
        initAuthWatchers();

        const attemptRefresh = async () => {
            const storedRefresh = localStorage.getItem('refreshToken');
            if (!storedRefresh) {
                setBootstrapped(true);
                return;
            }
            try {
                const data = await rotateTokens(storedRefresh);
                setAccessToken(data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                touchRefreshWatcher();
            } catch {
                clearAllAuth();
                setUserState(null);
            } finally {
                if (mounted) setBootstrapped(true);
            }
        };

        attemptRefresh();

        const handleStorage = (event: StorageEvent) => {
            if (!event.key) return;
            if (event.key === 'user') {
                syncUserFromStorage();
            }
            if (event.key === 'refreshToken') {
                touchRefreshWatcher();
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => {
            mounted = false;
            window.removeEventListener('storage', handleStorage);
        };
    }, [syncUserFromStorage]);

    const setUser = useCallback((nextUser: StoredUser | null) => {
        setUserState(nextUser);
        setStoredUser(nextUser);
    }, []);

    const logout = useCallback(async () => {
        try {
            if (user) {
                await logoutUser(user._id);
            }
        } catch {
            // Ignore API errors during logout to avoid trapping user
        } finally {
            clearAllAuth();
            setUserState(null);
            setStoredUser(null);
            queryClient.clear();
        }
    }, [queryClient, user]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            bootstrapped,
            setUser,
            logout,
        }),
        [user, bootstrapped, setUser, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
};


