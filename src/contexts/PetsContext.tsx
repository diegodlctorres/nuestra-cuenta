import React, { createContext, useContext } from 'react';
import { usePets } from '../hooks/usePets';

type PetsContextValue = ReturnType<typeof usePets>;

const PetsContext = createContext<PetsContextValue | null>(null);

export function PetsProvider({ children }: { children: React.ReactNode }) {
  const value = usePets();

  return (
    <PetsContext.Provider value={value}>
      {children}
    </PetsContext.Provider>
  );
}

export function usePetsContext() {
  const context = useContext(PetsContext);

  if (!context) {
    throw new Error('usePetsContext debe usarse dentro de PetsProvider');
  }

  return context;
}
