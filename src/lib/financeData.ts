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

async function fetchTransactionById(householdId: string, transactionId: string) {
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
    .eq('id', transactionId)
    .single();

  if (response.error) {
    throw response.error;
  }

  const transaction = response.data as TransactionWithCreatorMember;
  const memberProfiles = await fetchHouseholdMemberProfiles();
  const creatorMap = new Map(
    memberProfiles.map(row => [row.member_id, mapMemberProfile(row)])
  );

  return {
    ...transaction,
    creator: creatorMap.get(transaction.created_by) || transaction.creator_member?.profile
  } as Transaction;
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
  const response = await supabase.rpc('create_household_transaction', {
    p_household_id: householdId,
    p_account_id: transaction.account_id,
    p_category_id: transaction.category_id || null,
    p_amount: transaction.amount,
    p_description: transaction.description,
    p_date: transaction.date.slice(0, 10),
    p_type: transaction.type,
    p_is_pet_related: transaction.is_pet_related
  });

  if (response.error) {
    throw response.error;
  }

  const createdTransaction = response.data as Transaction;
  return fetchTransactionById(householdId, createdTransaction.id);
}

export async function createCategory(householdId: string, name: string, kind: 'income' | 'expense') {
  const response = await supabase.rpc('create_household_category', {
    p_household_id: householdId,
    p_name: name,
    p_kind: kind
  });

  if (response.error) {
    throw response.error;
  }

  return response.data as Category;
}

export async function removeCategory(householdId: string, id: string) {
  const response = await supabase.rpc('delete_household_category', {
    p_household_id: householdId,
    p_category_id: id
  });
  if (response.error) {
    throw response.error;
  }
}

export async function createAccount(householdId: string, name: string, emoji?: string) {
  const response = await supabase.rpc('create_household_account', {
    p_household_id: householdId,
    p_name: name,
    p_emoji: emoji || getDefaultAccountEmoji()
  });

  if (response.error) {
    throw response.error;
  }

  return response.data as Account;
}

export async function editAccount(householdId: string, id: string, updates: Partial<Account>) {
  const response = await supabase.rpc('update_household_account', {
    p_household_id: householdId,
    p_account_id: id,
    p_name: updates.name || '',
    p_emoji: updates.emoji || null
  });

  if (response.error) {
    throw response.error;
  }

  return response.data as Account;
}

export async function removeAccount(householdId: string, id: string) {
  const response = await supabase.rpc('delete_household_account', {
    p_household_id: householdId,
    p_account_id: id
  });

  if (response.error) {
    throw response.error;
  }
}

export async function removeTransaction(householdId: string, id: string) {
  const response = await supabase.rpc('delete_household_transaction', {
    p_household_id: householdId,
    p_transaction_id: id
  });
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
    const currentBalance = balances[transaction.account_id];
    if (transaction.account_id && currentBalance !== undefined) {
      const amount = Number(transaction.amount);
      balances[transaction.account_id] = currentBalance + (transaction.type === 'income' ? amount : -amount);
    }
  });

  return balances;
}
