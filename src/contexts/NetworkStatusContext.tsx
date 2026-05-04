import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface NetworkStatusContextValue {
  isOnline: boolean;
  wasOffline: boolean;
}

const NetworkStatusContext = createContext<NetworkStatusContextValue | null>(null);

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!wasOffline || !isOnline) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setWasOffline(false);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [isOnline, wasOffline]);

  const value = useMemo(() => ({
    isOnline,
    wasOffline
  }), [isOnline, wasOffline]);

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext);

  if (!context) {
    throw new Error('useNetworkStatus debe usarse dentro de NetworkStatusProvider');
  }

  return context;
}
