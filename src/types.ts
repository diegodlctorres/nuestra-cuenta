/**
 * Types definition reflecting the Supabase Database Schema
 */

export type ThemeType = 'default' | 'oceanic' | 'nature' | 'sunset';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type RecurrenceType = 'none' | 'fixed' | 'variable';
export type AccountType = 'savings' | 'checking';
export type CategoryKind = 'income' | 'expense';
export type MemberRole = 'admin' | 'member';
export type MemberStatus = 'active' | 'inactive';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

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
  name: string;
  nickname?: string;
  gender?: string;
  birthDate?: string;
  photoUrl?: string;
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
  type: AccountType;
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
  created_by: string; // household_member_id
  account_id: string; // fk to Account
  category_id?: string; // fk to Category (optional for some incomes)
  amount: number;
  description: string;
  date: string;
  type: TransactionType;
  is_pet_related: boolean;
  recurrence: RecurrenceType;
  
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
  completed: boolean;
  notes?: string;
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
  completed: boolean;
  isDebt?: boolean;
}
