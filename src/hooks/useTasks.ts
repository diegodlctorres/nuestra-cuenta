import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  RenderableTaskReminder,
  TaskInput
} from '../types';
import {
  archiveTaskSeriesRecord,
  completeReminderRecord,
  createTask,
  deleteReminderRecord,
  deleteSeriesFromReminderRecord,
  editTask,
  loadTaskReminders,
  reopenReminderRecord
} from '../lib/tasksData';
import { queryKeys } from '../lib/queryKeys';

export interface TaskMutationResult {
  success: boolean;
  error?: string;
}

export interface ReminderViewRange {
  start: string;
  end: string;
}

export function useTasks() {
  const { householdId } = useAuth();
  const [viewRange, setViewRange] = useState<ReminderViewRange | null>(null);
  const queryClient = useQueryClient();
  const taskQueryPrefix = ['tasks', householdId] as const;

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(householdId, viewRange),
    queryFn: () => loadTaskReminders(householdId!, viewRange!),
    enabled: Boolean(householdId && viewRange)
  });

  const tasks = tasksQuery.data || [];
  const isLoading = tasksQuery.isLoading;
  const invalidateTasks = useCallback(() => (
    queryClient.invalidateQueries({ queryKey: taskQueryPrefix })
  ), [householdId, queryClient]);

  const updateTaskQueries = useCallback((
    updater: (reminders: RenderableTaskReminder[]) => RenderableTaskReminder[]
  ) => {
    queryClient.setQueriesData<RenderableTaskReminder[]>(
      { queryKey: taskQueryPrefix },
      (current) => current ? updater(current) : current
    );
  }, [queryClient, taskQueryPrefix]);

  const snapshotTaskQueries = useCallback(() => (
    queryClient.getQueriesData<RenderableTaskReminder[]>({ queryKey: taskQueryPrefix })
  ), [queryClient, taskQueryPrefix]);

  const restoreTaskQueries = useCallback((
    snapshots: Array<[readonly unknown[], RenderableTaskReminder[] | undefined]>
  ) => {
    snapshots.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  }, [queryClient]);

  const addTaskMutation = useMutation({
    mutationFn: (task: TaskInput) => createTask(householdId!, task),
    onSuccess: invalidateTasks
  });

  const addTask = async (task: TaskInput): Promise<TaskMutationResult> => {
    if (!householdId) return { success: false, error: 'No se encontró un hogar activo.' };

    try {
      await addTaskMutation.mutateAsync(task);
      return { success: true };
    } catch (error) {
      console.error('Error adding task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'No se pudo guardar el recordatorio.'
      };
    }
  };

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, task }: { taskId: string; task: TaskInput }) => editTask(taskId, task),
    onSuccess: invalidateTasks
  });

  const updateTask = async (taskId: string, task: TaskInput): Promise<TaskMutationResult> => {
    try {
      await updateTaskMutation.mutateAsync({ taskId, task });
      return { success: true };
    } catch (error) {
      console.error('Error updating task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'No se pudo actualizar el recordatorio.'
      };
    }
  };

  const completeReminderMutation = useMutation({
    mutationFn: completeReminderRecord,
    onMutate: async (reminder) => {
      await queryClient.cancelQueries({ queryKey: taskQueryPrefix });
      const previous = snapshotTaskQueries();

      updateTaskQueries((reminders) => reminders.map((entry) => (
        entry.id === reminder.id
          ? {
              ...entry,
              completed: true,
              sourceStatus: 'completed',
              completedAt: new Date().toISOString()
            }
          : entry
      )));

      return { previous };
    },
    onError: (_error, _reminder, context) => {
      if (context?.previous) {
        restoreTaskQueries(context.previous);
      }
    },
    onSettled: invalidateTasks
  });

  const completeReminder = async (reminder: RenderableTaskReminder) => {
    try {
      await completeReminderMutation.mutateAsync(reminder);
      return true;
    } catch (error) {
      console.error('Error completing reminder:', error);
      return false;
    }
  };

  const reopenReminderMutation = useMutation({
    mutationFn: reopenReminderRecord,
    onMutate: async (reminder) => {
      await queryClient.cancelQueries({ queryKey: taskQueryPrefix });
      const previous = snapshotTaskQueries();

      updateTaskQueries((reminders) => reminders.map((entry) => (
        entry.id === reminder.id
          ? {
              ...entry,
              completed: false,
              sourceStatus: 'pending',
              completedAt: null
            }
          : entry
      )));

      return { previous };
    },
    onError: (_error, _reminder, context) => {
      if (context?.previous) {
        restoreTaskQueries(context.previous);
      }
    },
    onSettled: invalidateTasks
  });

  const reopenReminder = async (reminder: RenderableTaskReminder) => {
    try {
      await reopenReminderMutation.mutateAsync(reminder);
      return true;
    } catch (error) {
      console.error('Error reopening reminder:', error);
      return false;
    }
  };

  const deleteReminderMutation = useMutation({
    mutationFn: deleteReminderRecord,
    onMutate: async (reminder) => {
      await queryClient.cancelQueries({ queryKey: taskQueryPrefix });
      const previous = snapshotTaskQueries();

      updateTaskQueries((reminders) => reminders.filter((entry) => entry.id !== reminder.id));

      return { previous };
    },
    onError: (_error, _reminder, context) => {
      if (context?.previous) {
        restoreTaskQueries(context.previous);
      }
    },
    onSettled: invalidateTasks
  });

  const deleteReminder = async (reminder: RenderableTaskReminder) => {
    try {
      await deleteReminderMutation.mutateAsync(reminder);
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  };

  const archiveTaskSeriesMutation = useMutation({
    mutationFn: archiveTaskSeriesRecord,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskQueryPrefix });
      const previous = snapshotTaskQueries();

      updateTaskQueries((reminders) => reminders.filter((entry) => entry.taskId !== taskId));

      return { previous };
    },
    onError: (_error, _taskId, context) => {
      if (context?.previous) {
        restoreTaskQueries(context.previous);
      }
    },
    onSettled: invalidateTasks
  });

  const archiveTaskSeries = async (taskId: string) => {
    try {
      await archiveTaskSeriesMutation.mutateAsync(taskId);
      return true;
    } catch (error) {
      console.error('Error archiving task series:', error);
      return false;
    }
  };

  const deleteSeriesFromReminderMutation = useMutation({
    mutationFn: deleteSeriesFromReminderRecord,
    onMutate: async (reminder) => {
      await queryClient.cancelQueries({ queryKey: taskQueryPrefix });
      const previous = snapshotTaskQueries();

      updateTaskQueries((reminders) => reminders.filter((entry) => entry.taskId !== reminder.taskId));

      return { previous };
    },
    onError: (_error, _reminder, context) => {
      if (context?.previous) {
        restoreTaskQueries(context.previous);
      }
    },
    onSettled: invalidateTasks
  });

  const deleteSeriesFromReminder = async (reminder: RenderableTaskReminder) => {
    try {
      await deleteSeriesFromReminderMutation.mutateAsync(reminder);
      return true;
    } catch (error) {
      console.error('Error deleting task series from occurrence:', error);
      return false;
    }
  };

  const downloadICS = (reminder: RenderableTaskReminder) => {
    const dateIso = reminder.occurrenceDate.replace(/-/g, '');
    const timeIso = reminder.occurrenceDueTime?.replace(':', '').slice(0, 4);
    const dtStart = timeIso
      ? `DTSTART:${dateIso}T${timeIso}00`
      : `DTSTART;VALUE=DATE:${dateIso}`;
    const dtEnd = timeIso
      ? `DTEND:${dateIso}T${timeIso}00`
      : `DTEND;VALUE=DATE:${dateIso}`;
    const recurrenceLine = reminder.isRecurring && reminder.recurrenceLabel
      ? `DESCRIPTION:Recordatorio recurrente de Nuestra Cuenta\\n${reminder.recurrenceLabel}.`
      : 'DESCRIPTION:Recordatorio de Nuestra Cuenta\\nGenerado de forma automática.';
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nuestra Cuenta//Recordatorios//ES',
      'BEGIN:VEVENT',
      `UID:${reminder.id}@nuestracuenta.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      dtStart,
      dtEnd,
      `SUMMARY:${reminder.title}`,
      recurrenceLine,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${reminder.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    tasks,
    addTask,
    updateTask,
    completeReminder,
    reopenReminder,
    deleteReminder,
    deleteSeriesFromReminder,
    archiveTaskSeries,
    downloadICS,
    setViewRange,
    isLoading
  };
}
