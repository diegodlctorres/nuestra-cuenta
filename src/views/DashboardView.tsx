import React from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Wallet, PawPrint } from 'lucide-react';
import { AddTransactionForm } from '../components/transactions/AddTransactionForm';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { Transaction, Category, CoupleSettings } from '../types';
import { formatCurrency } from '../lib/utils';

interface DashboardViewProps {
  pendingPetTasksCount: number;
  transactions: Transaction[];
  coupleSettings: CoupleSettings;
  categories: Category[];
  accounts: Account[];
  accountBalances: Record<string, number>;
  addTransaction: (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => void;
  setActiveTab: (tab: 'dashboard' | 'detail' | 'pets' | 'tasks' | 'settings') => void;
  setSelectedAccountId: (id: string | null) => void;
}

export function DashboardView({
  pendingPetTasksCount,
  transactions,
  coupleSettings,
  categories,
  accounts,
  accountBalances,
  addTransaction,
  setActiveTab,
  setSelectedAccountId
}: DashboardViewProps) {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <AddTransactionForm onAdd={addTransaction} categories={categories} accounts={accounts} />

      {/* Dynamic Account Cards */}
      <div className="grid grid-cols-1 gap-4">
        {accounts.map((acc, index) => {
          const isPrimary = index === 0;
          const balance = accountBalances[acc.id] || 0;
          
          return (
            <div
              key={acc.id}
              onClick={() => {
                setSelectedAccountId(acc.id);
                setActiveTab('detail');
              }}
              className={cn(
                "rounded-3xl p-6 shadow-xl cursor-pointer active:scale-[0.98] transition-all border",
                isPrimary 
                  ? "bg-primary-600 text-white shadow-primary-100 border-transparent" 
                  : "bg-white text-slate-900 border-slate-200 shadow-slate-100"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-xl", isPrimary ? "bg-white/20" : "bg-slate-100")}>
                  {acc.type === 'savings' ? (
                    <PiggyBank className={cn("w-6 h-6", isPrimary ? "text-white" : "text-primary-600")} />
                  ) : (
                    <Wallet className={cn("w-6 h-6", isPrimary ? "text-white" : "text-slate-600")} />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                  isPrimary ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {acc.type === 'savings' ? 'Ahorros / Metas' : 'Día a Día'}
                </span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">{acc.name}</div>
              <div className="text-3xl font-bold mb-1">{formatCurrency(balance)}</div>
              <div className={cn("text-sm", isPrimary ? "text-primary-100" : "text-slate-500")}>
                Haz clic para ver el detalle
              </div>
            </div>
          );
        })}

        {accounts.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
             <p className="text-slate-400 text-sm">No hay cuentas configuradas.</p>
             <button 
              onClick={() => setActiveTab('settings')}
              className="text-primary-600 font-bold text-sm mt-2"
             >
               Ir a configuración
             </button>
          </div>
        )}
      </div>

      <div className="bg-secondary-50 rounded-3xl p-6 border border-secondary-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-secondary-500 rounded-xl">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-secondary-900">Mascotas</h3>
            <p className="text-xs text-secondary-700">Tareas pendientes</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-secondary-900">{pendingPetTasksCount} tareas</div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Actividad Reciente</h3>
          <button onClick={() => setActiveTab('detail')} className="text-primary-600 text-sm font-medium">Ver todo</button>
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
