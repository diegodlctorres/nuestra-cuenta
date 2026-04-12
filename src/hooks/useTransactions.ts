import { useState, useEffect, useMemo } from 'react';
import { Transaction, AccountType } from '../types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('nc_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nc_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const savingsBalance = useMemo(() =>
    transactions.filter(t => t.account === 'savings').reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0)
    , [transactions]);

  const expensesBalance = useMemo(() =>
    transactions.filter(t => t.account === 'expenses').reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0)
    , [transactions]);

  const groupedTransactions = useMemo(() => {
    const filterByAccount = (acc: AccountType) => transactions.filter(t => t.account === acc);

    return {
      expenses: {
        incomes: filterByAccount('expenses').filter(t => t.type === 'income'),
        fixed: filterByAccount('expenses').filter(t => t.type === 'expense' && t.recurrence === 'fixed'),
        variable: filterByAccount('expenses').filter(t => t.type === 'expense' && (t.recurrence === 'variable' || !t.recurrence)),
      },
      savings: {
        incomes: filterByAccount('savings').filter(t => t.type === 'income'),
        fixed: filterByAccount('savings').filter(t => t.type === 'expense' && t.recurrence === 'fixed'),
        variable: filterByAccount('savings').filter(t => t.type === 'expense' && (t.recurrence === 'variable' || !t.recurrence)),
      }
    };
  }, [transactions]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    setTransactions([newTransaction, ...transactions]);
  };

  return { transactions, savingsBalance, expensesBalance, groupedTransactions, addTransaction };
}
