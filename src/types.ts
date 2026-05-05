/**
 * Types definition reflecting the Supabase Database Schema
 */

export type ThemeType = 'default' | 'oceanic' | 'nature' | 'sunset';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryKind = 'income' | 'expense';
export type MemberRole = 'admin' | 'member';
export type MemberStatus = 'active' | 'inactive';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type RecurrenceUnit = 'day' | 'week' | 'month' | 'year';
export type RecurrenceEndType = 'never' | 'until';
export type TaskOccurrenceStatus = 'pending' | 'completed' | 'skipped' | 'deleted';

export interface Household {
  id: string;
  created_at: string;
  theme: ThemeType;
}

export interface Profile {
  id: string; // references Supabase auth.users
  name: string;
  nickname?: string | undefined;
  gender?: string | undefined;
  birth_date?: string | undefined;
  avatar_url?: string | undefined;
}

export interface Partner {
  id?: string | undefined;
  name: string;
  nickname?: string | undefined;
  gender?: string | undefined;
  birthDate?: string | undefined;
  photoUrl?: string | undefined;
  isCurrentUser?: boolean | undefined;
}

export interface CoupleSettings {
  partner1: Partner;
  partner2: Partner;
  theme?: ThemeType | undefined;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  profile_id: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
  
  // Relations mapped by Supabase (select "profiles(name,...)" )
  profile?: Profile | undefined;
}

export interface HouseholdInvitation {
  id: string;
  household_id: string;
  email: string;
  token: string;
  invited_by: string; // profile_id
  status: InvitationStatus;
  expires_at: string;
}

export interface Account {
  id: string;
  household_id: string;
  name: string; // e.g. "Fondo Común", "Bolsillo Mascotas"
  emoji?: string | undefined;
  is_active: boolean;
}

export interface Category {
  id: string;
  household_id: string;
  name: string;
  kind: CategoryKind;
}

export interface Transaction {
  id: string;
  household_id: string;
  created_at: string;
  created_by: string; // household_member_id
  account_id: string; // fk to Account
  category_id?: string | undefined; // fk to Category (optional for some incomes)
  amount: number;
  description: string;
  date: string;
  type: TransactionType;
  is_pet_related: boolean;
  
  // Potential joined relations
  account?: Account | undefined;
  category?: Category | undefined;
  creator?: Profile | undefined;
}

export interface Pet {
  id: string;
  household_id: string;
  name: string;
  species: string;
  breed?: string | undefined;
  birth_date?: string | undefined;
  photo_url?: string | undefined;
}

export interface PetTask {
  id: string;
  pet_id: string;
  title: string;
  scheduled_date: string;
  scheduled_time?: string | undefined;
  completed_date?: string | undefined;
  completed_by?: string | undefined;
  completed: boolean;
  notes?: string | undefined;
  completedByMember?: HouseholdMember | undefined;
}

export interface PetTaskInput {
  petIds: string[];
  title: string;
  scheduled_date: string;
  scheduled_time?: string | undefined;
  notes?: string | undefined;
}

export interface Task {
  id: string;
  household_id: string;
  title: string;
  deadline: string;
  due_time?: string | undefined;
  completed: boolean;
  requires_transaction?: boolean | undefined;
  is_recurring: boolean;
  recurrence_unit?: RecurrenceUnit | null | undefined;
  recurrence_interval?: number | null | undefined;
  recurrence_end_type?: RecurrenceEndType | null | undefined;
  recurrence_until?: string | null | undefined;
  series_anchor_date?: string | null | undefined;
  archived_at?: string | null | undefined;
}

export interface TaskInput {
  title: string;
  deadline: string;
  due_time?: string | undefined;
  requires_transaction?: boolean | undefined;
  is_recurring: boolean;
  recurrence_unit?: RecurrenceUnit | null | undefined;
  recurrence_interval?: number | null | undefined;
  recurrence_end_type?: RecurrenceEndType | null | undefined;
  recurrence_until?: string | null | undefined;
  series_anchor_date?: string | null | undefined;
}

export interface TaskOccurrence {
  id: string;
  task_id: string;
  occurrence_date: string;
  occurrence_due_time?: string | null | undefined;
  status: TaskOccurrenceStatus;
  completed_at?: string | null | undefined;
  requires_transaction_snapshot?: boolean | null | undefined;
  created_at?: string | undefined;
}

export interface RenderableTaskReminder {
  id: string;
  taskId: string;
  title: string;
  occurrenceDate: string;
  occurrenceDueTime?: string | undefined;
  completed: boolean;
  requiresTransaction: boolean;
  isRecurring: boolean;
  sourceStatus: TaskOccurrenceStatus;
  completedAt?: string | null | undefined;
  recurrenceLabel?: string | undefined;
  recurrenceDescription?: string | undefined;
  task: Task;
}
