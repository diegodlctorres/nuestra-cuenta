import { subDays } from 'date-fns';
import { supabase } from './supabase';
import {
  fromStoredOccurrenceTime,
  getPreviousOccurrenceDate,
  normalizeTaskInput,
  resolveTaskReminders,
  toStoredOccurrenceTime
} from './taskRecurrence';
import {
  RenderableTaskReminder,
  Task,
  TaskInput,
  TaskOccurrence
} from '../types';
import { ReminderViewRange } from '../hooks/useTasks';

function normalizeTask(task: Task): Task {
  return {
    ...task,
    is_recurring: Boolean(task.is_recurring),
    recurrence_unit: task.recurrence_unit || null,
    recurrence_interval: task.recurrence_interval ?? null,
    recurrence_end_type: task.recurrence_end_type || null,
    recurrence_until: task.recurrence_until || null,
    series_anchor_date: task.series_anchor_date || task.deadline,
    archived_at: task.archived_at || null,
    requires_transaction: Boolean(task.requires_transaction)
  };
}

async function fetchTasks(householdId: string) {
  const response = await supabase
    .from('tasks')
    .select('*')
    .eq('household_id', householdId)
    .order('deadline', { ascending: true });

  if (response.error) {
    throw response.error;
  }

  return ((response.data || []) as Task[]).map(normalizeTask);
}

async function fetchTaskOccurrences(tasks: Task[], viewRange: ReminderViewRange) {
  if (tasks.length === 0) {
    return [] as TaskOccurrence[];
  }

  const response = await supabase
    .from('task_occurrences')
    .select('*')
    .in('task_id', tasks.map(task => task.id))
    .gte('occurrence_date', viewRange.start)
    .lte('occurrence_date', viewRange.end);

  if (response.error) {
    throw response.error;
  }

  return ((response.data || []) as TaskOccurrence[]).map(occurrence => ({
    ...occurrence,
    occurrence_due_time: fromStoredOccurrenceTime(occurrence.occurrence_due_time)
  }));
}

export async function loadTaskReminders(householdId: string, viewRange: ReminderViewRange): Promise<RenderableTaskReminder[]> {
  const tasks = await fetchTasks(householdId);
  const occurrences = await fetchTaskOccurrences(tasks, viewRange);

  return resolveTaskReminders(tasks, occurrences, viewRange.start, viewRange.end);
}

export async function createTask(householdId: string, task: TaskInput) {
  const normalizedTask = normalizeTaskInput(task);
  const response = await supabase
    .from('tasks')
    .insert({
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
    });

  if (response.error) {
    throw response.error;
  }
}

export async function editTask(householdId: string, taskId: string, task: TaskInput) {
  const normalizedTask = normalizeTaskInput(task);
  const response = await supabase
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
    .eq('household_id', householdId)
    .eq('id', taskId);

  if (response.error) {
    throw response.error;
  }
}

export async function completeReminderRecord(householdId: string, reminder: RenderableTaskReminder) {
  if (!reminder.isRecurring) {
    const response = await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('household_id', householdId)
      .eq('id', reminder.taskId);

    if (response.error) {
      throw response.error;
    }
    return;
  }

  const response = await supabase.rpc('upsert_task_occurrence_status', {
    p_household_id: householdId,
    p_task_id: reminder.taskId,
    p_occurrence_date: reminder.occurrenceDate,
    p_occurrence_due_time: toStoredOccurrenceTime(reminder.occurrenceDueTime),
    p_status: 'completed',
    p_requires_transaction_snapshot: reminder.requiresTransaction
  });

  if (response.error) {
    throw response.error;
  }
}

export async function reopenReminderRecord(householdId: string, reminder: RenderableTaskReminder) {
  if (!reminder.isRecurring) {
    const response = await supabase
      .from('tasks')
      .update({ completed: false })
      .eq('household_id', householdId)
      .eq('id', reminder.taskId);

    if (response.error) {
      throw response.error;
    }
    return;
  }

  const response = await supabase.rpc('upsert_task_occurrence_status', {
    p_household_id: householdId,
    p_task_id: reminder.taskId,
    p_occurrence_date: reminder.occurrenceDate,
    p_occurrence_due_time: toStoredOccurrenceTime(reminder.occurrenceDueTime),
    p_status: 'pending',
    p_requires_transaction_snapshot: reminder.requiresTransaction
  });

  if (response.error) {
    throw response.error;
  }
}

export async function deleteReminderRecord(householdId: string, reminder: RenderableTaskReminder) {
  if (!reminder.isRecurring) {
    const response = await supabase
      .from('tasks')
      .delete()
      .eq('household_id', householdId)
      .eq('id', reminder.taskId);

    if (response.error) {
      throw response.error;
    }
    return;
  }

  const response = await supabase.rpc('upsert_task_occurrence_status', {
    p_household_id: householdId,
    p_task_id: reminder.taskId,
    p_occurrence_date: reminder.occurrenceDate,
    p_occurrence_due_time: toStoredOccurrenceTime(reminder.occurrenceDueTime),
    p_status: 'deleted',
    p_requires_transaction_snapshot: reminder.requiresTransaction
  });

  if (response.error) {
    throw response.error;
  }
}

export async function archiveTaskSeriesRecord(householdId: string, taskId: string) {
  const response = await supabase
    .from('tasks')
    .update({ archived_at: new Date().toISOString() })
    .eq('household_id', householdId)
    .eq('id', taskId);

  if (response.error) {
    throw response.error;
  }
}

export async function deleteSeriesFromReminderRecord(householdId: string, reminder: RenderableTaskReminder) {
  if (!reminder.isRecurring) {
    return deleteReminderRecord(householdId, reminder);
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

  const response = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('household_id', householdId)
    .eq('id', reminder.taskId);

  if (response.error) {
    throw response.error;
  }
}
