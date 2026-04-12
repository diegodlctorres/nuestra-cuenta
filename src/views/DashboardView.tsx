import React from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Wallet, PawPrint } from 'lucide-react';
import { AddTransactionForm } from '../components/transactions/AddTransactionForm';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { Transaction, Category, CoupleSettings } from '../types';
import { formatCurrency } from '../lib/utils';

interface DashboardViewProps {
  savingsBalance: number;
  expensesBalance: number;
  pendingPetTasksCount: number;
  transactions: Transaction[];
  coupleSettings: CoupleSettings;
  categories: Category[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  setActiveTab: (tab: 'dashboard' | 'detail' | 'pets' | 'tasks' | 'settings') => void;
  setDetailSubTab: (tab: 'expenses' | 'savings') => void;
}

export function DashboardView({
  savingsBalance,
  expensesBalance,
  pendingPetTasksCount,
  transactions,
  coupleSettings,
  categories,
  addTransaction,
  setActiveTab,
  setDetailSubTab
}: DashboardViewProps) {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <AddTransactionForm onAdd={addTransaction} categories={categories} coupleSettings={coupleSettings} />

      {/* Account Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div
          onClick={() => {
            setActiveTab('detail');
            setDetailSubTab('savings');
          }}
          className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <PiggyBank className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Ahorros / Futuro</span>
          </div>
          <div className="text-3xl font-bold mb-1">{formatCurrency(savingsBalance)}</div>
          <div className="text-indigo-100 text-sm">Uso recreativo y metas</div>
        </div>

        <div
          onClick={() => {
            setActiveTab('detail');
            setDetailSubTab('expenses');
          }}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-xl">
              <Wallet className="w-6 h-6 text-slate-600" />
            </div>
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Gastos</span>
          </div>
          <div className="text-3xl font-bold mb-1 text-slate-900">{formatCurrency(expensesBalance)}</div>
          <div className="text-slate-500 text-sm">Fijos, viajes y salidas</div>
        </div>
      </div>

      <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-500 rounded-xl">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-rose-900">Mascotas</h3>
            <p className="text-xs text-rose-700">Tareas pendientes</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-900">{pendingPetTasksCount} tareas</div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Actividad Reciente</h3>
          <button onClick={() => setActiveTab('detail')} className="text-indigo-600 text-sm font-medium">Ver todo</button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 3).map(t => (
            <TransactionItem key={t.id} t={t} coupleSettings={coupleSettings} showRecurrence={false} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
