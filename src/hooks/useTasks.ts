import { useState, useEffect, useCallback } from 'react';
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
  const [tasks, setTasks] = useState<RenderableTaskReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewRange, setViewRange] = useState<ReminderViewRange | null>(null);

  const loadTasks = useCallback(async () => {
    if (!householdId || !viewRange) return;

    setIsLoading(true);

    try {
      const reminders = await loadTaskReminders(householdId, viewRange);
      setTasks(reminders);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, viewRange]);

  useEffect(() => {
    if (!viewRange) return;
    loadTasks();
  }, [loadTasks, viewRange]);

  const addTask = async (task: TaskInput): Promise<TaskMutationResult> => {
    if (!householdId) return { success: false, error: 'No se encontró un hogar activo.' };

    try {
      await createTask(householdId, task);
      await loadTasks();
      return { success: true };
    } catch (error) {
      console.error('Error adding task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'No se pudo guardar el recordatorio.'
      };
    }
  };

  const updateTask = async (taskId: string, task: TaskInput): Promise<TaskMutationResult> => {
    try {
      await editTask(taskId, task);
      await loadTasks();
      return { success: true };
    } catch (error) {
      console.error('Error updating task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'No se pudo actualizar el recordatorio.'
      };
    }
  };

  const completeReminder = async (reminder: RenderableTaskReminder) => {
    try {
      await completeReminderRecord(reminder);
      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error completing reminder:', error);
      return false;
    }
  };

  const reopenReminder = async (reminder: RenderableTaskReminder) => {
    try {
      await reopenReminderRecord(reminder);
      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error reopening reminder:', error);
      return false;
    }
  };

  const deleteReminder = async (reminder: RenderableTaskReminder) => {
    try {
      await deleteReminderRecord(reminder);
      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  };

  const archiveTaskSeries = async (taskId: string) => {
    try {
      await archiveTaskSeriesRecord(taskId);
      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error archiving task series:', error);
      return false;
    }
  };

  const deleteSeriesFromReminder = async (reminder: RenderableTaskReminder) => {
    try {
      await deleteSeriesFromReminderRecord(reminder);
      await loadTasks();
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
