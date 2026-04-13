import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Account, Category } from '../types';

export function useTransactions() {
  const { householdId, user } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Data
  const loadData = useCallback(async () => {
    if (!householdId) return;
    setIsLoading(true);

    try {
      // Fetch Accounts
      let { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at');
        
      // Fetch Categories
      let { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at');

      // Bootstrapping: If new household with 0 accounts/categories, create standard ones
      if (!accountsData || accountsData.length === 0) {
        const defaultAccounts = [
          { household_id: householdId, name: 'Gasto Común', type: 'checking' },
          { household_id: householdId, name: 'Ahorros Compartidos', type: 'savings' }
        ];
        await supabase.from('accounts').insert(defaultAccounts);
        
        const defaultCategories = [
          { household_id: householdId, name: 'General', kind: 'expense' },
          { household_id: householdId, name: 'Sueldo/Ingreso', kind: 'income' }
        ];
        await supabase.from('categories').insert(defaultCategories);

        // Re-fetch
        const [accRes, catRes] = await Promise.all([
          supabase.from('accounts').select('*').eq('household_id', householdId).order('created_at'),
          supabase.from('categories').select('*').eq('household_id', householdId).order('created_at')
        ]);
        accountsData = accRes.data;
        categoriesData = catRes.data;
      }

      setAccounts((accountsData as Account[]) || []);
      setCategories((categoriesData as Category[]) || []);

      // Fetch Transactions
      const { data: transData } = await supabase
        .from('transactions')
        .select(`
          *,
          account:accounts(*),
          category:categories(*),
          creator:profiles(*)
        `)
        .eq('household_id', householdId)
        .order('date', { ascending: false });

      setTransactions((transData as any[]) || []);

    } catch (error) {
      console.error('Error fetching finance data', error);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadData();

    // Sincronización al volver a la App (Focus)
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);


  const savingsBalance = useMemo(() =>
    transactions
      .filter(t => t.account?.type === 'savings')
      .reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0)
  , [transactions]);

  const expensesBalance = useMemo(() =>
    transactions
      .filter(t => t.account?.type === 'checking')
      .reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0)
  , [transactions]);

  const groupedTransactions = useMemo(() => {
    const filterByAccount = (accType: string) => transactions.filter(t => t.account?.type === accType);

    return {
      expenses: {
        incomes: filterByAccount('checking').filter(t => t.type === 'income'),
        fixed: filterByAccount('checking').filter(t => t.type === 'expense' && t.recurrence === 'fixed'),
        variable: filterByAccount('checking').filter(t => t.type === 'expense' && (t.recurrence === 'variable' || t.recurrence === 'none')),
      },
      savings: {
        incomes: filterByAccount('savings').filter(t => t.type === 'income'),
        fixed: filterByAccount('savings').filter(t => t.type === 'expense' && t.recurrence === 'fixed'),
        variable: filterByAccount('savings').filter(t => t.type === 'expense' && (t.recurrence === 'variable' || t.recurrence === 'none')),
      }
    };
  }, [transactions]);

  const addTransaction = async (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => {
    if (!householdId || !user) return;
    try {
      const dbTx = {
        ...t,
        household_id: householdId,
        created_by: user.id
      };
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(dbTx)
        .select(`*, account:accounts(*), category:categories(*), creator:profiles(*)`)
        .single();
        
      if (error) throw error;
      if (data) {
        setTransactions([data as any, ...transactions]);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction', error);
    }
  };

  return { 
    transactions, 
    accounts, 
    categories, 
    savingsBalance, 
    expensesBalance, 
    groupedTransactions, 
    addTransaction, 
    deleteTransaction,
    isLoading 
  };
}
