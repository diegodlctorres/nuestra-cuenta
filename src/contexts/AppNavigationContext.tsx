import React, { createContext, useContext, useMemo, useState } from 'react';

export type AppTab = 'dashboard' | 'detail' | 'pets' | 'tasks' | 'settings';

interface AppNavigationContextValue {
  activeTab: AppTab;
  setActiveTab: React.Dispatch<React.SetStateAction<AppTab>>;
  selectedAccountId: string | null;
  setSelectedAccountId: React.Dispatch<React.SetStateAction<string | null>>;
}

const AppNavigationContext = createContext<AppNavigationContextValue | null>(null);

export function AppNavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const value = useMemo(() => ({
    activeTab,
    setActiveTab,
    selectedAccountId,
    setSelectedAccountId
  }), [activeTab, selectedAccountId]);

  return (
    <AppNavigationContext.Provider value={value}>
      {children}
    </AppNavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(AppNavigationContext);

  if (!context) {
    throw new Error('useAppNavigation debe usarse dentro de AppNavigationProvider');
  }

  return context;
}
