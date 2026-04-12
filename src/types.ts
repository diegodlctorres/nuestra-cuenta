export type AccountType = 'savings' | 'expenses';
export type RecurrenceType = 'fixed' | 'variable';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  account: AccountType;
  type: TransactionType;
  isPetRelated?: boolean;
  recurrence?: RecurrenceType;
  createdBy?: string;
}

export interface Partner {
  name: string;
  nickname?: string;
  birthDate?: string;
  gender?: string;
  photoUrl?: string;
}

export interface CoupleSettings {
  partner1: Partner;
  partner2: Partner;
}

export interface Category {
  id: string;
  name: string;
  type: AccountType;
}

export interface Task {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
  isDebt?: boolean;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  photoUrl?: string;
}

export interface PetTask {
  id: string;
  petId: string;
  title: string;
  scheduledDate: string;
  scheduledTime?: string;
  completedDate?: string;
  completed: boolean;
  notes?: string;
}
