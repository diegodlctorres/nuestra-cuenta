import { supabase } from './supabase';
import { getDefaultAccountEmoji } from './accountEmojis';
import { fetchHouseholdMemberProfiles, mapMemberProfile } from './householdProfiles';
import { Account, Category, Transaction } from '../types';

type TransactionWithCreatorMember = Transaction & {
  creator_member?: {
    profile?: Transaction['creator'];
  };
};

export interface FinanceSnapshot {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
}

export async function bootstrapHouseholdFinance(householdId: string) {
  const { error } = await supabase.rpc('bootstrap_household', { h_id: householdId });
  return { error };
}

export async function fetchAccounts(householdId: string) {
  const response = await supabase
    .from('accounts')
    .select('*')
    .eq('household_id', householdId)
    .order('name');

  if (response.error) {
    throw response.error;
  }

  return (response.data || []) as Account[];
}

export async function fetchCategories(householdId: string) {
  const response = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .order('name');

  if (response.error) {
    throw response.error;
  }

  return (response.data || []) as Category[];
}

export async function fetchTransactions(householdId: string) {
  const response = await supabase
    .from('transactions')
    .select(`
      *,
      account:accounts(*),
      category:categories(*),
      creator_member:household_members(
        profile:profiles(*)
      )
    `)
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (response.error) {
    throw response.error;
  }

  const memberProfiles = await fetchHouseholdMemberProfiles();
  const creatorMap = new Map(
    memberProfiles.map(row => [row.member_id, mapMemberProfile(row)])
  );

  return ((response.data || []) as TransactionWithCreatorMember[]).map(transaction => ({
    ...transaction,
    creator: creatorMap.get(transaction.created_by) || transaction.creator_member?.profile
  })) as Transaction[];
}

export async function loadFinanceSnapshot(householdId: string): Promise<FinanceSnapshot> {
  const { error } = await bootstrapHouseholdFinance(householdId);
  if (error) {
    console.error('>> Error en bootstrap_household:', error);
  }

  const [accounts, categories, transactions] = await Promise.all([
    fetchAccounts(householdId),
    fetchCategories(householdId),
    fetchTransactions(householdId)
  ]);

  return {
    accounts,
    categories,
    transactions
  };
}

export async function createTransaction(
  householdId: string,
  memberId: string,
  transaction: Omit<Transaction, 'id' | 'household_id' | 'created_by'>
) {
  const response = await supabase
    .from('transactions')
    .insert({
      ...transaction,
      household_id: householdId,
      created_by: memberId
    })
    .select(`
      *,
      account:accounts(*),
      category:categories(*),
      creator_member:household_members(
        profile:profiles(*)
      )
    `)
    .single();

  if (response.error) {
    throw response.error;
  }

  const memberProfiles = await fetchHouseholdMemberProfiles();
  const creatorMap = new Map(
    memberProfiles.map(row => [row.member_id, mapMemberProfile(row)])
  );

  return {
    ...response.data,
    creator: creatorMap.get(memberId) || (response.data as TransactionWithCreatorMember).creator_member?.profile
  } as Transaction;
}

export async function createCategory(householdId: string, name: string, kind: 'income' | 'expense') {
  const response = await supabase
    .from('categories')
    .insert({ name, kind, household_id: householdId })
    .select()
    .single();

  if (response.error) {
    throw response.error;
  }

  return response.data as Category;
}

export async function removeCategory(id: string) {
  const response = await supabase.from('categories').delete().eq('id', id);
  if (response.error) {
    throw response.error;
  }
}

export async function createAccount(householdId: string, name: string, emoji?: string) {
  const response = await supabase
    .from('accounts')
    .insert({
      name,
      household_id: householdId,
      emoji: emoji || getDefaultAccountEmoji()
    })
    .select()
    .single();

  if (response.error) {
    throw response.error;
  }

  return response.data as Account;
}

export async function editAccount(id: string, updates: Partial<Account>) {
  const response = await supabase
    .from('accounts')
    .update({
      name: updates.name,
      emoji: updates.emoji
    })
    .eq('id', id)
    .select()
    .single();

  if (response.error) {
    throw response.error;
  }

  return response.data as Account;
}

export async function removeAccount(id: string) {
  const response = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (response.error) {
    throw response.error;
  }
}

export async function removeTransaction(id: string) {
  const response = await supabase.from('transactions').delete().eq('id', id);
  if (response.error) {
    throw response.error;
  }
}

export function calculateAccountBalances(accounts: Account[], transactions: Transaction[]) {
  const balances: Record<string, number> = {};

  accounts.forEach(account => {
    balances[account.id] = 0;
  });

  transactions.forEach(transaction => {
    if (transaction.account_id && balances[transaction.account_id] !== undefined) {
      const amount = Number(transaction.amount);
      balances[transaction.account_id] += transaction.type === 'income' ? amount : -amount;
    }
  });

  return balances;
}
