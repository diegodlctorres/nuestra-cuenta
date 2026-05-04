import { useState, useEffect, useCallback } from 'react';
import { subDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  RenderableTaskReminder,
  Task,
  TaskInput,
  TaskOccurrence
} from '../types';
import {
  fromStoredOccurrenceTime,
  getPreviousOccurrenceDate,
  normalizeTaskInput,
  resolveTaskReminders,
  toStoredOccurrenceTime
} from '../lib/taskRecurrence';

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

    const { start, end } = viewRange;
    setIsLoading(true);

    try {
      const { data: taskData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', householdId)
        .order('deadline', { ascending: true });

      if (tasksError) throw tasksError;

      const normalizedTasks = ((taskData || []) as Task[]).map(task => ({
        ...task,
        is_recurring: Boolean(task.is_recurring),
        recurrence_unit: task.recurrence_unit || null,
        recurrence_interval: task.recurrence_interval ?? null,
        recurrence_end_type: task.recurrence_end_type || null,
        recurrence_until: task.recurrence_until || null,
        series_anchor_date: task.series_anchor_date || task.deadline,
        archived_at: task.archived_at || null,
        requires_transaction: Boolean(task.requires_transaction)
      }));

      const taskIds = normalizedTasks.map(task => task.id);
      let normalizedOccurrences: TaskOccurrence[] = [];

      if (taskIds.length > 0) {
        const { data: occurrenceData, error: occurrencesError } = await supabase
          .from('task_occurrences')
          .select('*')
          .in('task_id', taskIds)
          .gte('occurrence_date', start)
          .lte('occurrence_date', end);

        if (occurrencesError) throw occurrencesError;

        normalizedOccurrences = ((occurrenceData || []) as TaskOccurrence[]).map(occurrence => ({
          ...occurrence,
          occurrence_due_time: fromStoredOccurrenceTime(occurrence.occurrence_due_time)
        }));
      }

      setTasks(resolveTaskReminders(normalizedTasks, normalizedOccurrences, start, end));
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
    const handleFocus = () => loadTasks();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadTasks, viewRange]);

  const addTask = async (task: TaskInput): Promise<TaskMutationResult> => {
    if (!householdId) return { success: false, error: 'No se encontró un hogar activo.' };

    try {
      const normalizedTask = normalizeTaskInput(task);
      const insertPayload = {
        title: normalizedTask.title,
        deadline: normalizedTask.deadline,
        due_time: normalizedTask.due_time || null,
        requires_transaction: Boolean(normalizedTask.requires_transaction),
        household_id: householdId,
        completed: false,
        is_recurring: normalizedTask.is_recurring,
        recurrence_unit: normalizedTask.recurrence_unit,
        recurrence_interval: normalizedTask.recurrence_interval,
        recurrence_end_type: normalizedTask.recurrence_end_type,
        recurrence_until: normalizedTask.recurrence_until,
        series_anchor_date: normalizedTask.series_anchor_date,
        archived_at: null
      };

      const { error } = await supabase
        .from('tasks')
        .insert(insertPayload);

      if (error) throw error;

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
      const normalizedTask = normalizeTaskInput(task);
      const { error } = await supabase
        .from('tasks')
        .update({
          title: normalizedTask.title,
          deadline: normalizedTask.deadline,
          due_time: normalizedTask.due_time || null,
          requires_transaction: Boolean(normalizedTask.requires_transaction),
          is_recurring: normalizedTask.is_recurring,
          recurrence_unit: normalizedTask.recurrence_unit,
          recurrence_interval: normalizedTask.recurrence_interval,
          recurrence_end_type: normalizedTask.recurrence_end_type,
          recurrence_until: normalizedTask.recurrence_until,
          series_anchor_date: normalizedTask.series_anchor_date,
          archived_at: null
        })
        .eq('id', taskId);

      if (error) throw error;

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
      if (!reminder.isRecurring) {
        const { error } = await supabase
          .from('tasks')
          .update({ completed: true })
          .eq('id', reminder.taskId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('task_occurrences')
          .upsert({
            task_id: reminder.taskId,
            occurrence_date: reminder.occurrenceDate,
            occurrence_due_time: toStoredOccurrenceTime(reminder.occurrenceDueTime),
            status: 'completed',
            completed_at: new Date().toISOString(),
            requires_transaction_snapshot: reminder.requiresTransaction
          }, {
            onConflict: 'task_id,occurrence_date,occurrence_due_time'
          });

        if (error) throw error;
      }

      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error completing reminder:', error);
      return false;
    }
  };

  const reopenReminder = async (reminder: RenderableTaskReminder) => {
    try {
      if (!reminder.isRecurring) {
        const { error } = await supabase
          .from('tasks')
          .update({ completed: false })
          .eq('id', reminder.taskId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('task_occurrences')
          .delete()
          .eq('task_id', reminder.taskId)
          .eq('occurrence_date', reminder.occurrenceDate)
          .eq('occurrence_due_time', toStoredOccurrenceTime(reminder.occurrenceDueTime));

        if (error) throw error;
      }

      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error reopening reminder:', error);
      return false;
    }
  };

  const deleteReminder = async (reminder: RenderableTaskReminder) => {
    try {
      if (!reminder.isRecurring) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', reminder.taskId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('task_occurrences')
          .upsert({
            task_id: reminder.taskId,
            occurrence_date: reminder.occurrenceDate,
            occurrence_due_time: toStoredOccurrenceTime(reminder.occurrenceDueTime),
            status: 'deleted',
            completed_at: null,
            requires_transaction_snapshot: reminder.requiresTransaction
          }, {
            onConflict: 'task_id,occurrence_date,occurrence_due_time'
          });

        if (error) throw error;
      }

      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  };

  const archiveTaskSeries = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error archiving task series:', error);
      return false;
    }
  };

  const deleteSeriesFromReminder = async (reminder: RenderableTaskReminder) => {
    try {
      if (!reminder.isRecurring) {
        return deleteReminder(reminder);
      }

      const previousOccurrenceDate = getPreviousOccurrenceDate(reminder.task, reminder.occurrenceDate);

      const updatePayload = previousOccurrenceDate
        ? {
            recurrence_end_type: 'until',
            recurrence_until: previousOccurrenceDate,
            archived_at: null
          }
        : {
            archived_at: subDays(new Date(`${reminder.occurrenceDate}T00:00:00`), 1).toISOString()
          };

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', reminder.taskId);

      if (error) throw error;

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
