import { ReminderViewRange } from '../hooks/useTasks';

export const queryKeys = {
  finance: (householdId: string | null) => ['finance', householdId] as const,
  pets: (householdId: string | null) => ['pets', householdId] as const,
  tasks: (householdId: string | null, viewRange?: ReminderViewRange | null) =>
    ['tasks', householdId, viewRange?.start || null, viewRange?.end || null] as const,
  settings: (householdId: string | null, userId: string | null) => ['settings', householdId, userId] as const
};
