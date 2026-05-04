import React, { createContext, useContext } from 'react';
import { useSettings } from '../hooks/useSettings';

type SettingsContextValue = ReturnType<typeof useSettings>;

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const value = useSettings();

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettingsContext debe usarse dentro de SettingsProvider');
  }

  return context;
}
