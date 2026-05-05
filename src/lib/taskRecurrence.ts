import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  RecurrenceEndType,
  RecurrenceUnit,
  RenderableTaskReminder,
  Task,
  TaskInput,
  TaskOccurrence
} from '../types';

export const REMINDER_WINDOW_PAST_DAYS = 30;
export const REMINDER_WINDOW_FUTURE_DAYS = 90;
export const ALL_DAY_OCCURRENCE_TIME = '23:59:59';

const TIME_FALLBACK = '__all_day__';

function addByUnit(date: Date, unit: RecurrenceUnit, interval: number) {
  switch (unit) {
    case 'day':
      return addDays(date, interval);
    case 'week':
      return addWeeks(date, interval);
    case 'month':
      return addMonths(date, interval);
    case 'year':
      return addYears(date, interval);
  }
}

function formatEvery(interval: number, singular: string, plural: string) {
  return interval === 1 ? `Cada ${singular}` : `Cada ${interval} ${plural}`;
}

export function buildRecurrenceLabel(task: Pick<TaskInput, 'is_recurring' | 'recurrence_unit' | 'recurrence_interval' | 'recurrence_end_type' | 'recurrence_until'>) {
  if (!task.is_recurring || !task.recurrence_unit) return undefined;

  const interval = task.recurrence_interval && task.recurrence_interval > 0 ? task.recurrence_interval : 1;
  let label = '';

  switch (task.recurrence_unit) {
    case 'day':
      label = formatEvery(interval, 'día', 'días');
      break;
    case 'week':
      label = formatEvery(interval, 'semana', 'semanas');
      break;
    case 'month':
      label = formatEvery(interval, 'mes', 'meses');
      break;
    case 'year':
      label = formatEvery(interval, 'año', 'años');
      break;
  }

  if (task.recurrence_end_type === 'until' && task.recurrence_until) {
    return `${label} hasta ${format(parseISO(task.recurrence_until), 'dd MMM yyyy', { locale: es })}`;
  }

  return label;
}

export function normalizeTaskInput(task: TaskInput): TaskInput {
  const normalizedIsRecurring = Boolean(task.is_recurring);
  const normalizedInterval = task.recurrence_interval && task.recurrence_interval > 0
    ? Math.floor(task.recurrence_interval)
    : 1;

  if (!normalizedIsRecurring) {
    return {
      title: task.title,
      deadline: task.deadline,
      due_time: task.due_time || undefined,
      requires_transaction: Boolean(task.requires_transaction),
      is_recurring: false,
      recurrence_unit: null,
      recurrence_interval: null,
      recurrence_end_type: null,
      recurrence_until: null,
      series_anchor_date: task.deadline
    };
  }

  const recurrenceEndType: RecurrenceEndType = task.recurrence_end_type === 'until' ? 'until' : 'never';

  return {
    title: task.title,
    deadline: task.deadline,
    due_time: task.due_time || undefined,
    requires_transaction: Boolean(task.requires_transaction),
    is_recurring: true,
    recurrence_unit: task.recurrence_unit || 'month',
    recurrence_interval: normalizedInterval,
    recurrence_end_type: recurrenceEndType,
    recurrence_until: recurrenceEndType === 'until' ? task.recurrence_until || task.deadline : null,
    series_anchor_date: task.series_anchor_date || task.deadline
  };
}

export function buildTaskInputFromTask(task: Task): TaskInput {
  return normalizeTaskInput({
    title: task.title,
    deadline: task.deadline,
    due_time: task.due_time,
    requires_transaction: Boolean(task.requires_transaction),
    is_recurring: task.is_recurring,
    recurrence_unit: task.recurrence_unit,
    recurrence_interval: task.recurrence_interval,
    recurrence_end_type: task.recurrence_end_type,
    recurrence_until: task.recurrence_until,
    series_anchor_date: task.series_anchor_date || task.deadline
  });
}

function buildOccurrenceKey(taskId: string, occurrenceDate: string, occurrenceDueTime?: string | null) {
  return `${taskId}::${occurrenceDate}::${occurrenceDueTime || TIME_FALLBACK}`;
}

export function toStoredOccurrenceTime(occurrenceDueTime?: string | null) {
  return occurrenceDueTime || ALL_DAY_OCCURRENCE_TIME;
}

export function fromStoredOccurrenceTime(occurrenceDueTime?: string | null) {
  return occurrenceDueTime === ALL_DAY_OCCURRENCE_TIME ? null : occurrenceDueTime || null;
}

function createRenderableReminder(task: Task, occurrence: {
  date: string;
  dueTime?: string | null | undefined;
  status: 'pending' | 'completed';
  completedAt?: string | null;
}): RenderableTaskReminder {
  return {
    id: buildOccurrenceKey(task.id, occurrence.date, occurrence.dueTime),
    taskId: task.id,
    title: task.title,
    occurrenceDate: occurrence.date,
    occurrenceDueTime: occurrence.dueTime || undefined,
    completed: occurrence.status === 'completed',
    requiresTransaction: Boolean(task.requires_transaction),
    isRecurring: task.is_recurring,
    sourceStatus: occurrence.status,
    completedAt: occurrence.completedAt || null,
    recurrenceLabel: buildRecurrenceLabel(buildTaskInputFromTask(task)),
    recurrenceDescription: task.is_recurring ? buildRecurrenceLabel(buildTaskInputFromTask(task)) : undefined,
    task
  };
}

export function resolveTaskReminders(tasks: Task[], occurrences: TaskOccurrence[], rangeStart: string, rangeEnd: string) {
  const rangeStartDate = startOfDay(parseISO(rangeStart));
  const rangeEndDate = startOfDay(parseISO(rangeEnd));
  const occurrencesByKey = new Map(
    occurrences.map(occurrence => [
      buildOccurrenceKey(occurrence.task_id, occurrence.occurrence_date, occurrence.occurrence_due_time),
      occurrence
    ])
  );

  const reminders: RenderableTaskReminder[] = [];

  for (const task of tasks) {
    if (!task.is_recurring) {
      reminders.push(createRenderableReminder(task, {
        date: task.deadline,
        dueTime: task.due_time,
        status: task.completed ? 'completed' : 'pending'
      }));
      continue;
    }

    const anchorValue = task.series_anchor_date || task.deadline;
    const anchorDate = startOfDay(parseISO(anchorValue));
    const endLimitValue = task.archived_at
      ? format(parseISO(task.archived_at), 'yyyy-MM-dd')
      : task.recurrence_end_type === 'until'
        ? task.recurrence_until || null
        : null;
    const endLimitDate = endLimitValue ? startOfDay(parseISO(endLimitValue)) : null;

    if (endLimitDate && isBefore(endLimitDate, rangeStartDate)) {
      continue;
    }

    let current = anchorDate;
    const interval = task.recurrence_interval && task.recurrence_interval > 0 ? task.recurrence_interval : 1;
    const unit = task.recurrence_unit || 'month';
    let safetyCounter = 0;

    while (isBefore(current, rangeStartDate)) {
      current = addByUnit(current, unit, interval);
      safetyCounter += 1;
      if (safetyCounter > 5000) break;
      if (endLimitDate && isAfter(current, endLimitDate)) break;
    }

    while (!isAfter(current, rangeEndDate)) {
      if (endLimitDate && isAfter(current, endLimitDate)) break;

      const occurrenceDate = format(current, 'yyyy-MM-dd');
      const key = buildOccurrenceKey(task.id, occurrenceDate, task.due_time);
      const persistedOccurrence = occurrencesByKey.get(key);

      if (!persistedOccurrence || persistedOccurrence.status === 'pending') {
        reminders.push(createRenderableReminder(task, {
          date: occurrenceDate,
          dueTime: task.due_time,
          status: 'pending'
        }));
      } else if (persistedOccurrence.status === 'completed') {
        reminders.push(createRenderableReminder(task, {
          date: occurrenceDate,
          dueTime: persistedOccurrence.occurrence_due_time || task.due_time,
          status: 'completed',
          completedAt: persistedOccurrence.completed_at || null
        }));
      }

      current = addByUnit(current, unit, interval);
      safetyCounter += 1;
      if (safetyCounter > 5000) break;
    }
  }

  return reminders.sort((left, right) => {
    if (left.completed !== right.completed) {
      return Number(left.completed) - Number(right.completed);
    }

    const dateCompare = left.occurrenceDate.localeCompare(right.occurrenceDate);
    if (dateCompare !== 0) return dateCompare;

    return (left.occurrenceDueTime || '').localeCompare(right.occurrenceDueTime || '');
  });
}

export function getPreviousOccurrenceDate(task: Task, occurrenceDate: string) {
  if (!task.is_recurring) return null;

  const anchorDate = startOfDay(parseISO(task.series_anchor_date || task.deadline));
  const targetDate = startOfDay(parseISO(occurrenceDate));
  const unit = task.recurrence_unit || 'month';
  const interval = task.recurrence_interval && task.recurrence_interval > 0 ? task.recurrence_interval : 1;

  if (isEqual(anchorDate, targetDate) || isAfter(anchorDate, targetDate)) {
    return null;
  }

  let previous = anchorDate;
  let current = addByUnit(anchorDate, unit, interval);
  let safetyCounter = 0;

  while (!isAfter(current, targetDate)) {
    if (isEqual(current, targetDate)) {
      return format(previous, 'yyyy-MM-dd');
    }

    previous = current;
    current = addByUnit(current, unit, interval);
    safetyCounter += 1;
    if (safetyCounter > 5000) break;
  }

  return format(previous, 'yyyy-MM-dd');
}
