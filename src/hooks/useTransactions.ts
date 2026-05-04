import { useState, useEffect, useCallback, useMemo } from 'react';
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

export function useTransactions() {
  const { householdId, memberId } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Data
  const loadData = useCallback(async () => {
    if (!householdId) return;
    setIsLoading(true);

    try {
      const snapshot = await loadFinanceSnapshot(householdId);
      setAccounts(snapshot.accounts);
      setCategories(snapshot.categories);
      setTransactions(snapshot.transactions);
    } catch (error) {
      console.error('Error fetching finance data', error);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const accountBalances = useMemo(() => {
    return calculateAccountBalances(accounts, transactions);
  }, [accounts, transactions]);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => {
    if (!householdId || !memberId) {
        console.error("No se puede agregar transacción sin householdId o memberId");
        return false;
    }
    try {
      const transaction = await createTransaction(householdId, memberId, t);
      setTransactions(currentTransactions => [transaction, ...currentTransactions]);
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  }, [householdId, memberId]);

  const deleteTransaction = async (id: string) => {
    try {
      await removeTransaction(id);
      setTransactions(currentTransactions => currentTransactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const addCategory = async (name: string, kind: 'income' | 'expense') => {
    if (!householdId) return;
    try {
      const category = await createCategory(householdId, name, kind);
      setCategories(currentCategories => [...currentCategories, category]);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await removeCategory(id);
      setCategories(currentCategories => currentCategories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const addAccount = async (name: string, emoji?: string) => {
    if (!householdId) return;
    try {
      const account = await createAccount(householdId, name, emoji);
      setAccounts(currentAccounts => [...currentAccounts, account]);
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const account = await editAccount(id, updates);
      setAccounts(currentAccounts => currentAccounts.map(a => a.id === id ? account : a));
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await removeAccount(id);
      setAccounts(currentAccounts => currentAccounts.filter(a => a.id !== id));
      setTransactions(currentTransactions => currentTransactions.filter(t => t.account_id !== id));
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
