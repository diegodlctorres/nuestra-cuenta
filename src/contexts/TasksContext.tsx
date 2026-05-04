import React, { createContext, useContext } from 'react';
import { useTasks } from '../hooks/useTasks';

type TasksContextValue = ReturnType<typeof useTasks>;

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const value = useTasks();

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasksContext() {
  const context = useContext(TasksContext);

  if (!context) {
    throw new Error('useTasksContext debe usarse dentro de TasksProvider');
  }

  return context;
}
