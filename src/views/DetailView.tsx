import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { MonthlyBalanceButton } from '../components/transactions/MonthlyBalanceButton';
import { TransactionGroup } from '../components/transactions/TransactionGroup';
import { cn } from '../lib/utils';
import { Transaction, AccountType, CoupleSettings } from '../types';

interface GroupedTransactions {
  expenses: {
    incomes: Transaction[];
    fixed: Transaction[];
    variable: Transaction[];
  };
  savings: {
    incomes: Transaction[];
    fixed: Transaction[];
    variable: Transaction[];
  };
}

interface DetailViewProps {
  detailSubTab: AccountType;
  setDetailSubTab: (tab: AccountType) => void;
  transactions: Transaction[];
  groupedTransactions: GroupedTransactions;
  coupleSettings: CoupleSettings;
}

export function DetailView({
  detailSubTab,
  setDetailSubTab,
  transactions,
  groupedTransactions,
  coupleSettings
}: DetailViewProps) {
  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 rounded-2xl">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Detalle</h2>
        </div>
        <MonthlyBalanceButton transactions={transactions} account={detailSubTab} />
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setDetailSubTab('expenses')}
          className={cn(
            "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
            detailSubTab === 'expenses' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          )}
        >
          Gastos
        </button>
        <button
          onClick={() => setDetailSubTab('savings')}
          className={cn(
            "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
            detailSubTab === 'savings' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          )}
        >
          Ahorros
        </button>
      </div>

      <div className="space-y-8">
        {detailSubTab === 'expenses' ? (
          <>
            <TransactionGroup
              title="Ingresos"
              icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
              transactions={groupedTransactions.expenses.incomes}
              coupleSettings={coupleSettings}
            />
            <TransactionGroup
              title="Gastos Fijos"
              icon={<Clock className="w-4 h-4 text-amber-500" />}
              transactions={groupedTransactions.expenses.fixed}
              coupleSettings={coupleSettings}
            />
            <TransactionGroup
              title="Gastos Variables"
              icon={<TrendingDown className="w-4 h-4 text-blue-500" />}
              transactions={groupedTransactions.expenses.variable}
              coupleSettings={coupleSettings}
            />

            {groupedTransactions.expenses.incomes.length === 0 && groupedTransactions.expenses.fixed.length === 0 && groupedTransactions.expenses.variable.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="text-slate-400 text-sm">No hay movimientos registrados</div>
              </div>
            )}
          </>
        ) : (
          <>
            <TransactionGroup
              title="Ingresos"
              icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
              transactions={groupedTransactions.savings.incomes}
              coupleSettings={coupleSettings}
            />
            <TransactionGroup
              title="Ahorros Fijos"
              icon={<Clock className="w-4 h-4 text-indigo-500" />}
              transactions={groupedTransactions.savings.fixed}
              coupleSettings={coupleSettings}
            />
            <TransactionGroup
              title="Ahorros Variables"
              icon={<TrendingDown className="w-4 h-4 text-blue-500" />}
              transactions={groupedTransactions.savings.variable}
              coupleSettings={coupleSettings}
            />

            {groupedTransactions.savings.incomes.length === 0 && groupedTransactions.savings.fixed.length === 0 && groupedTransactions.savings.variable.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="text-slate-400 text-sm">No hay movimientos registrados</div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
