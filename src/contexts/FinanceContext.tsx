import React, { createContext, useContext } from 'react';
import { useTransactions } from '../hooks/useTransactions';

type FinanceContextValue = ReturnType<typeof useTransactions>;

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const value = useTransactions();

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error('useFinance debe usarse dentro de FinanceProvider');
  }

  return context;
}
