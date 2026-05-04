import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Account, Category } from '../types';
import {
  calculateAccountBalances,
  createAccount,
  createCategory,
  createTransaction,
  editAccount,
  loadFinanceSnapshot,
  removeAccount,
  removeCategory,
  removeTransaction
} from '../lib/financeData';
import { queryKeys } from '../lib/queryKeys';

export function useTransactions() {
  const { householdId, memberId } = useAuth();
  const queryClient = useQueryClient();

  const financeQuery = useQuery({
    queryKey: queryKeys.finance(householdId),
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

  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => {
      if (!householdId || !memberId) {
        throw new Error('No se puede agregar transacción sin householdId o memberId');
      }

      return createTransaction(householdId, memberId, transaction);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance(householdId) })
  });

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => {
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance(householdId) })
  });

  const deleteTransaction = async (id: string) => {
    try {
      await deleteTransactionMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const addCategoryMutation = useMutation({
    mutationFn: ({ name, kind }: { name: string; kind: 'income' | 'expense' }) => createCategory(householdId!, name, kind),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance(householdId) })
  });

  const addCategory = async (name: string, kind: 'income' | 'expense') => {
    if (!householdId) return;
    try {
      await addCategoryMutation.mutateAsync({ name, kind });
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: removeCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance(householdId) })
  });

  const deleteCategory = async (id: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const addAccountMutation = useMutation({
    mutationFn: ({ name, emoji }: { name: string; emoji?: string }) => createAccount(householdId!, name, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance(householdId) })
  });

  const addAccount = async (name: string, emoji?: string) => {
    if (!householdId) return;
    try {
      await addAccountMutation.mutateAsync({ name, emoji });
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Account> }) => editAccount(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance(householdId) })
  });

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      await updateAccountMutation.mutateAsync({ id, updates });
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const deleteAccountMutation = useMutation({
    mutationFn: removeAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance(householdId) })
  });

  const deleteAccount = async (id: string) => {
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
