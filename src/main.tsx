import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { NetworkStatusProvider } from './contexts/NetworkStatusContext.tsx';
import { queryClient } from './lib/queryClient';
import { applyStoredTheme } from './lib/theme';
import './index.css';

applyStoredTheme();

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('No se pudo registrar el service worker:', error);
      });
    });
  } else {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });

    if ('caches' in window) {
      void caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.startsWith('nuestra-cuenta-shell')) {
            void caches.delete(cacheName);
          }
        });
      });
    }
  }
}

const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

if (isStandalone) {
  document.documentElement.dataset.displayMode = 'standalone';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NetworkStatusProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </NetworkStatusProvider>
  </StrictMode>,
);
