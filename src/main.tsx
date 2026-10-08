import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './app/auth';
import { ErrorBoundary } from './features/system/ErrorBoundary';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120_000, // revisiting a page shows cached data instantly; edits refresh what they change
      retry: (count, error) => count < 2 && !/permission|not found|JWT/i.test(String((error as Error)?.message)),
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{ style: { background: '#11161e', border: '1px solid #2a3443', color: '#e6edf3' } }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Installable app + offline page (production only, so local development is never cached).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* the site works fine without it */
    });
  });
}
