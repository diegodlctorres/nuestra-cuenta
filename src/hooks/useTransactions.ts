import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Account, Category } from '../types';
import {
  calculateAccountBalances,
  FinanceSnapshot,
  createAccount,
  createCategory,
  createTransaction,
  editAccount,
  loadFinanceSnapshot,
  removeAccount,
  removeCategory,
  removeTransaction
} from '../lib/financeData';
import { isOffline, OFFLINE_MUTATION_MESSAGE } from '../lib/networkStatus';
import { queryKeys } from '../lib/queryKeys';

export function useTransactions() {
  const { householdId, memberId } = useAuth();
  const queryClient = useQueryClient();
  const financeQueryKey = queryKeys.finance(householdId);

  const financeQuery = useQuery({
    queryKey: financeQueryKey,
    queryFn: () => loadFinanceSnapshot(householdId!),
    enabled: Boolean(householdId)
  });

  const transactions = financeQuery.data?.transactions || [];
  const accounts = financeQuery.data?.accounts || [];
  const categories = financeQuery.data?.categories || [];
  const isLoading = financeQuery.isLoading;


  const accountBalances = useMemo(() => {
    return calculateAccountBalances(accounts, transactions);
  }, [accounts, transactions]);

  const updateFinanceSnapshot = useCallback((updater: (snapshot: FinanceSnapshot) => FinanceSnapshot) => {
    queryClient.setQueryData<FinanceSnapshot>(financeQueryKey, (current) => {
      const baseSnapshot = current || {
        accounts: [],
        categories: [],
        transactions: []
      };

      return updater(baseSnapshot);
    });
  }, [financeQueryKey, queryClient]);

  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => {
      if (!householdId || !memberId) {
        throw new Error('No se puede agregar transacción sin householdId o memberId');
      }

      return createTransaction(householdId, memberId, transaction);
    },
    onSuccess: (createdTransaction) => {
      updateFinanceSnapshot((snapshot) => ({
        ...snapshot,
        transactions: [createdTransaction, ...snapshot.transactions]
      }));
    }
  });

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => {
    if (isOffline()) {
      console.warn(OFFLINE_MUTATION_MESSAGE);
      return false;
    }
    if (!householdId || !memberId) {
      console.error("No se puede agregar transacción sin householdId o memberId");
      return false;
    }
    try {
      await addTransactionMutation.mutateAsync(t);
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  }, [addTransactionMutation, householdId, memberId]);

  const deleteTransactionMutation = useMutation({
    mutationFn: removeTransaction,
    onMutate: async (transactionId) => {
      await queryClient.cancelQueries({ queryKey: financeQueryKey });
      const previous = queryClient.getQueryData<FinanceSnapshot>(financeQueryKey);

      updateFinanceSnapshot((snapshot) => ({
        ...snapshot,
        transactions: snapshot.transactions.filter((transaction) => transaction.id !== transactionId)
      }));

      return { previous };
    },
    onError: (_error, _transactionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(financeQueryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: financeQueryKey })
  });

  const deleteTransaction = async (id: string) => {
    if (isOffline()) {
      console.warn(OFFLINE_MUTATION_MESSAGE);
      return;
    }
    try {
      await deleteTransactionMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const addCategoryMutation = useMutation({
    mutationFn: ({ name, kind }: { name: string; kind: 'income' | 'expense' }) => createCategory(householdId!, name, kind),
    onSuccess: (createdCategory) => {
      updateFinanceSnapshot((snapshot) => ({
        ...snapshot,
        categories: [...snapshot.categories, createdCategory].sort((a, b) => a.name.localeCompare(b.name))
      }));
    }
  });

  const addCategory = async (name: string, kind: 'income' | 'expense') => {
    if (isOffline()) {
      console.warn(OFFLINE_MUTATION_MESSAGE);
      return;
    }
    if (!householdId) return;
    try {
      await addCategoryMutation.mutateAsync({ name, kind });
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: removeCategory,
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: financeQueryKey });
      const previous = queryClient.getQueryData<FinanceSnapshot>(financeQueryKey);

      updateFinanceSnapshot((snapshot) => ({
        ...snapshot,
        categories: snapshot.categories.filter((category) => category.id !== categoryId)
      }));

      return { previous };
    },
    onError: (_error, _categoryId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(financeQueryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: financeQueryKey })
  });

  const deleteCategory = async (id: string) => {
    if (isOffline()) {
      console.warn(OFFLINE_MUTATION_MESSAGE);
      return;
    }
    try {
      await deleteCategoryMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const addAccountMutation = useMutation({
    mutationFn: ({ name, emoji }: { name: string; emoji?: string }) => createAccount(householdId!, name, emoji),
    onSuccess: (createdAccount) => {
      updateFinanceSnapshot((snapshot) => ({
        ...snapshot,
        accounts: [...snapshot.accounts, createdAccount].sort((a, b) => a.name.localeCompare(b.name))
      }));
    }
  });

  const addAccount = async (name: string, emoji?: string) => {
    if (isOffline()) {
      console.warn(OFFLINE_MUTATION_MESSAGE);
      return;
    }
    if (!householdId) return;
    try {
      await addAccountMutation.mutateAsync({ name, emoji });
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Account> }) => editAccount(id, updates),
    onSuccess: (updatedAccount) => {
      updateFinanceSnapshot((snapshot) => ({
        ...snapshot,
        accounts: snapshot.accounts
          .map((account) => account.id === updatedAccount.id ? updatedAccount : account)
          .sort((a, b) => a.name.localeCompare(b.name))
      }));
    }
  });

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    if (isOffline()) {
      console.warn(OFFLINE_MUTATION_MESSAGE);
      return;
    }
    try {
      await updateAccountMutation.mutateAsync({ id, updates });
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const deleteAccountMutation = useMutation({
    mutationFn: removeAccount,
    onMutate: async (accountId) => {
      await queryClient.cancelQueries({ queryKey: financeQueryKey });
      const previous = queryClient.getQueryData<FinanceSnapshot>(financeQueryKey);

      updateFinanceSnapshot((snapshot) => ({
        ...snapshot,
        accounts: snapshot.accounts.filter((account) => account.id !== accountId),
        transactions: snapshot.transactions.filter((transaction) => transaction.account_id !== accountId)
      }));

      return { previous };
    },
    onError: (_error, _accountId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(financeQueryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: financeQueryKey })
  });

  const deleteAccount = async (id: string) => {
    if (isOffline()) {
      console.warn(OFFLINE_MUTATION_MESSAGE);
      return false;
    }
    try {
      await deleteAccountMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  };

  return { 
    transactions, 
    accounts, 
    categories, 
    accountBalances,
    addTransaction, 
    deleteTransaction,
    addCategory,
    deleteCategory,
    addAccount,
    updateAccount,
    deleteAccount,
    isLoading 
  };
}
