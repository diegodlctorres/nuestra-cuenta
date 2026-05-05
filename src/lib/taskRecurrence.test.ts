import { describe, expect, it } from 'vitest';
import { Task } from '../types';
import {
  ALL_DAY_OCCURRENCE_TIME,
  fromStoredOccurrenceTime,
  getPreviousOccurrenceDate,
  resolveTaskReminders,
  toStoredOccurrenceTime
} from './taskRecurrence';

const recurringTask: Task = {
  id: 'task-1',
  household_id: 'household-1',
  title: 'Pagar internet',
  deadline: '2026-05-01',
  due_time: '09:00',
  completed: false,
  requires_transaction: true,
  is_recurring: true,
  recurrence_unit: 'week',
  recurrence_interval: 1,
  recurrence_end_type: 'never',
  recurrence_until: null,
  series_anchor_date: '2026-05-01',
  archived_at: null
};

describe('taskRecurrence', () => {
  it('maps all-day occurrence storage values', () => {
    expect(toStoredOccurrenceTime()).toBe(ALL_DAY_OCCURRENCE_TIME);
    expect(fromStoredOccurrenceTime(ALL_DAY_OCCURRENCE_TIME)).toBeNull();
    expect(fromStoredOccurrenceTime('09:30:00')).toBe('09:30:00');
  });

  it('resolves recurring reminders within a date range', () => {
    const reminders = resolveTaskReminders([recurringTask], [], '2026-05-01', '2026-05-15');

    expect(reminders.map(reminder => reminder.occurrenceDate)).toEqual([
      '2026-05-01',
      '2026-05-08',
      '2026-05-15'
    ]);
    expect(reminders.every(reminder => reminder.requiresTransaction)).toBe(true);
  });

  it('uses persisted completed occurrences over generated pending state', () => {
    const reminders = resolveTaskReminders(
      [recurringTask],
      [{
        id: 'occurrence-1',
        task_id: recurringTask.id,
        occurrence_date: '2026-05-08',
        occurrence_due_time: '09:00',
        status: 'completed',
        completed_at: '2026-05-08T10:00:00Z'
      }],
      '2026-05-01',
      '2026-05-08'
    );

    expect(reminders.find(reminder => reminder.occurrenceDate === '2026-05-08')?.completed).toBe(true);
  });

  it('finds the previous occurrence before cutting a series', () => {
    expect(getPreviousOccurrenceDate(recurringTask, '2026-05-15')).toBe('2026-05-08');
  });
});
