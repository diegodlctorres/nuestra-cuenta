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
  nickname?: string;
  gender?: string;
  birth_date?: string;
  avatar_url?: string;
}

export interface Partner {
  id?: string;
  name: string;
  nickname?: string;
  gender?: string;
  birthDate?: string;
  photoUrl?: string;
  isCurrentUser?: boolean;
}

export interface CoupleSettings {
  partner1: Partner;
  partner2: Partner;
  theme?: ThemeType;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  profile_id: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
  
  // Relations mapped by Supabase (select "profiles(name,...)" )
  profile?: Profile;
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
  emoji?: string;
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
  category_id?: string; // fk to Category (optional for some incomes)
  amount: number;
  description: string;
  date: string;
  type: TransactionType;
  is_pet_related: boolean;
  
  // Potential joined relations
  account?: Account;
  category?: Category;
  creator?: Profile;
}

export interface Pet {
  id: string;
  household_id: string;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  photo_url?: string;
}

export interface PetTask {
  id: string;
  pet_id: string;
  title: string;
  scheduled_date: string;
  scheduled_time?: string;
  completed_date?: string;
  completed_by?: string;
  completed: boolean;
  notes?: string;
  completedByMember?: HouseholdMember;
}

export interface PetTaskInput {
  petIds: string[];
  title: string;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
}

export interface Task {
  id: string;
  household_id: string;
  title: string;
  deadline: string;
  due_time?: string;
  completed: boolean;
  requires_transaction?: boolean;
  is_recurring: boolean;
  recurrence_unit?: RecurrenceUnit | null;
  recurrence_interval?: number | null;
  recurrence_end_type?: RecurrenceEndType | null;
  recurrence_until?: string | null;
  series_anchor_date?: string | null;
  archived_at?: string | null;
}

export interface TaskInput {
  title: string;
  deadline: string;
  due_time?: string;
  requires_transaction?: boolean;
  is_recurring: boolean;
  recurrence_unit?: RecurrenceUnit | null;
  recurrence_interval?: number | null;
  recurrence_end_type?: RecurrenceEndType | null;
  recurrence_until?: string | null;
  series_anchor_date?: string | null;
}

export interface TaskOccurrence {
  id: string;
  task_id: string;
  occurrence_date: string;
  occurrence_due_time?: string | null;
  status: TaskOccurrenceStatus;
  completed_at?: string | null;
  requires_transaction_snapshot?: boolean | null;
  created_at?: string;
}

export interface RenderableTaskReminder {
  id: string;
  taskId: string;
  title: string;
  occurrenceDate: string;
  occurrenceDueTime?: string;
  completed: boolean;
  requiresTransaction: boolean;
  isRecurring: boolean;
  sourceStatus: TaskOccurrenceStatus;
  completedAt?: string | null;
  recurrenceLabel?: string;
  recurrenceDescription?: string;
  task: Task;
}
