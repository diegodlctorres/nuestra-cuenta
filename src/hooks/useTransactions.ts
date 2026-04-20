import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Account, Category, AccountType } from '../types';

type TransactionWithCreatorMember = Transaction & {
  creator_member?: {
    profile?: Transaction['creator'];
  };
};

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
      // 1. Ejecutar Bootstrap en el servidor (Crea cuentas/categorías si faltan)
      const { error: rpcErr } = await supabase.rpc('bootstrap_household', { h_id: householdId });
      if (rpcErr) console.error(">> Error en bootstrap_household:", rpcErr);

      // 2. Cargar Cuentas y Categorías
      const [{ data: accs }, { data: cats }] = await Promise.all([
        supabase.from('accounts').select('*').eq('household_id', householdId).order('name'),
        supabase.from('categories').select('*').eq('household_id', householdId).order('name')
      ]);

      setAccounts(accs || []);
      setCategories(cats || []);

      // 3. Cargar Transacciones con Join profundo
      const { data: transData, error: transErr } = await supabase
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
        .order('date', { ascending: false });

      if (transErr) {
        console.error(">> Error cargando transacciones:", transErr);
      } else {
        const mapped = ((transData || []) as TransactionWithCreatorMember[]).map(t => ({
          ...t,
          creator: t.creator_member?.profile
        }));
        setTransactions(mapped as Transaction[]);
      }

    } catch (error) {
      console.error('Error fetching finance data', error);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadData();

    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);


  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    // Inicializar balances en 0 para todas las cuentas conocidas
    accounts.forEach(acc => {
      balances[acc.id] = 0;
    });

    // Sumar/Restar según transacciones
    transactions.forEach(t => {
      if (t.account_id && balances[t.account_id] !== undefined) {
        const amount = Number(t.amount);
        balances[t.account_id] += (t.type === 'income' ? amount : -amount);
      }
    });

    return balances;
  }, [accounts, transactions]);

  const groupedTransactions = useMemo(() => {
    const filterByAccount = (accType: string) => transactions.filter(t => t.account?.type === accType);

    return {
      expenses: {
        incomes: filterByAccount('checking').filter(t => t.type === 'income'),
        fixed: filterByAccount('checking').filter(t => t.type === 'expense' && t.recurrence === 'fixed'),
        variable: filterByAccount('checking').filter(t => t.type === 'expense' && t.recurrence !== 'fixed'),
      },
      savings: {
        incomes: filterByAccount('savings').filter(t => t.type === 'income'),
        fixed: filterByAccount('savings').filter(t => t.type === 'expense' && t.recurrence === 'fixed'),
        variable: filterByAccount('savings').filter(t => t.type === 'expense' && t.recurrence !== 'fixed'),
      }
    };
  }, [transactions]);

  const addTransaction = async (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => {
    if (!householdId || !memberId) {
        console.error("No se puede agregar transacción sin householdId o memberId");
        return;
    }
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...t,
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

      if (error) throw error;
      
      const mapped = {
        ...data,
        creator: (data as TransactionWithCreatorMember).creator_member?.profile
      };

      setTransactions([mapped as Transaction, ...transactions]);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const addCategory = async (name: string, kind: 'income' | 'expense') => {
    if (!householdId) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name, kind, household_id: householdId })
        .select()
        .single();
      if (error) throw error;
      setCategories([...categories, data as Category]);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const addAccount = async (name: string, type: AccountType) => {
    if (!householdId) return;
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({ name, type, household_id: householdId })
        .select()
        .single();
      if (error) throw error;
      setAccounts([...accounts, data as Account]);
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setAccounts(accounts.map(a => a.id === id ? data as Account : a));
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      // Nota: El backend borrará las transacciones en cascada si así está configurado el FK.
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
      setAccounts(accounts.filter(a => a.id !== id));
      // También filtramos las transacciones locales para consistencia inmediata
      setTransactions(transactions.filter(t => t.account_id !== id));
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  return { 
    transactions, 
    accounts, 
    categories, 
    accountBalances,
    groupedTransactions, 
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
