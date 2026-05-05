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
import { MutationResult, mutationError, mutationMessage, mutationOk } from '../lib/errors';
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

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId || !memberId) {
      return mutationMessage('No se puede agregar transacción sin un hogar activo.');
    }
    try {
      await addTransactionMutation.mutateAsync(t);
      return mutationOk();
    } catch (error) {
      console.error('Error adding transaction:', error);
      return mutationError(error, 'No se pudo guardar la transacción. Inténtalo nuevamente.');
    }
  }, [addTransactionMutation, householdId, memberId]);

  const deleteTransactionMutation = useMutation({
    mutationFn: (transactionId: string) => {
      if (!householdId) {
        throw new Error('No se puede eliminar transacción sin householdId');
      }

      return removeTransaction(householdId, transactionId);
    },
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

  const deleteTransaction = async (id: string): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      await deleteTransactionMutation.mutateAsync(id);
      return mutationOk();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return mutationError(error, 'No se pudo eliminar la transacción.');
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

  const addCategory = async (name: string, kind: 'income' | 'expense'): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      await addCategoryMutation.mutateAsync({ name, kind });
      return mutationOk();
    } catch (error) {
      console.error('Error adding category:', error);
      return mutationError(error, 'No se pudo crear la categoría.');
    }
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => {
      if (!householdId) {
        throw new Error('No se puede eliminar categoría sin householdId');
      }

      return removeCategory(householdId, categoryId);
    },
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

  const deleteCategory = async (id: string): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      await deleteCategoryMutation.mutateAsync(id);
      return mutationOk();
    } catch (error) {
      console.error('Error deleting category:', error);
      return mutationError(error, 'No se pudo eliminar la categoría.');
    }
  };

  const addAccountMutation = useMutation({
    mutationFn: ({ name, emoji }: { name: string; emoji?: string | undefined }) => createAccount(householdId!, name, emoji),
    onSuccess: (createdAccount) => {
      updateFinanceSnapshot((snapshot) => ({
        ...snapshot,
        accounts: [...snapshot.accounts, createdAccount].sort((a, b) => a.name.localeCompare(b.name))
      }));
    }
  });

  const addAccount = async (name: string, emoji?: string): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      await addAccountMutation.mutateAsync({ name, emoji });
      return mutationOk();
    } catch (error) {
      console.error('Error adding account:', error);
      return mutationError(error, 'No se pudo crear la cuenta.');
    }
  };

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Account> }) => {
      if (!householdId) {
        throw new Error('No se puede actualizar cuenta sin householdId');
      }

      return editAccount(householdId, id, updates);
    },
    onSuccess: (updatedAccount) => {
      updateFinanceSnapshot((snapshot) => ({
        ...snapshot,
        accounts: snapshot.accounts
          .map((account) => account.id === updatedAccount.id ? updatedAccount : account)
          .sort((a, b) => a.name.localeCompare(b.name))
      }));
    }
  });

  const updateAccount = async (id: string, updates: Partial<Account>): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      await updateAccountMutation.mutateAsync({ id, updates });
      return mutationOk();
    } catch (error) {
      console.error('Error updating account:', error);
      return mutationError(error, 'No se pudo actualizar la cuenta.');
    }
  };

  const deleteAccountMutation = useMutation({
    mutationFn: (accountId: string) => {
      if (!householdId) {
        throw new Error('No se puede eliminar cuenta sin householdId');
      }

      return removeAccount(householdId, accountId);
    },
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

  const deleteAccount = async (id: string): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      await deleteAccountMutation.mutateAsync(id);
      return mutationOk();
    } catch (error) {
      console.error('Error deleting account:', error);
      return mutationError(error, 'No se pudo eliminar la cuenta.');
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
