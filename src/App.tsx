import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { useEffect, useState } from 'react';
import { getAccessToken, setAccessToken, clearAllAuth, initAuthWatchers } from '@/lib/auth';
import { refreshToken } from '@/lib/api';
// Dashboard removed

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [bootstrapped, setBootstrapped] = useState(false);

  // On app start: if refresh token exists, try to obtain an access token for this session
  useEffect(() => {
    const init = async () => {
      try {
        const storedRefresh = localStorage.getItem('refreshToken');
        if (storedRefresh && !getAccessToken()) {
          const data = await refreshToken(storedRefresh);
          setAccessToken(data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      } catch (_) {
        // clear stale tokens if refresh fails
        clearAllAuth();
      } finally {
        setBootstrapped(true);
      }
    };
    init();
    initAuthWatchers();
  }, []);

  if (!bootstrapped) return null;

  // ProtectedRoute not needed currently since home is public and other protected pages are removed
  const PublicOnlyRoute = ({ element }: { element: React.ReactElement }) => {
    const hasAccess = Boolean(getAccessToken());
    return hasAccess ? <Navigate to="/" replace /> : element;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicOnlyRoute element={<Login />} />} />
          <Route path="/signup" element={<PublicOnlyRoute element={<SignUp />} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;