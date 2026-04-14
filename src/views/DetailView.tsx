import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Clock, Wallet, PiggyBank, ArrowRightLeft } from 'lucide-react';
import { MonthlyBalanceButton } from '../components/transactions/MonthlyBalanceButton';
import { TransactionGroup } from '../components/transactions/TransactionGroup';
import { cn, formatCurrency } from '../lib/utils';
import { Transaction, Account, CoupleSettings } from '../types';

interface DetailViewProps {
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  transactions: Transaction[];
  accounts: Account[];
  accountBalances: Record<string, number>;
  coupleSettings: CoupleSettings;
}

export function DetailView({
  selectedAccountId,
  setSelectedAccountId,
  transactions,
  accounts,
  accountBalances,
  coupleSettings
}: DetailViewProps) {
  
  // Si no hay cuenta seleccionada, seleccionamos la primera disponible
  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId, setSelectedAccountId]);

  const currentAccount = useMemo(() => 
    accounts.find(a => a.id === selectedAccountId) || accounts[0]
  , [accounts, selectedAccountId]);

  const currentBalance = useMemo(() => 
    currentAccount ? (accountBalances[currentAccount.id] || 0) : 0
  , [currentAccount, accountBalances]);

  const filteredGroups = useMemo(() => {
    if (!currentAccount) return { incomes: [], fixed: [], variable: [] };

    const accountTransactions = transactions.filter(t => t.account_id === currentAccount.id);

    return {
      incomes: accountTransactions.filter(t => t.type === 'income'),
      fixed: accountTransactions.filter(t => t.type === 'expense' && t.recurrence === 'fixed'),
      variable: accountTransactions.filter(t => t.type === 'expense' && t.recurrence !== 'fixed'),
    };
  }, [transactions, currentAccount]);

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="p-4 bg-slate-100 rounded-full text-slate-400">
          <Wallet className="w-10 h-10" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">No hay cuentas</h3>
          <p className="text-sm text-slate-500">Crea una cuenta en configuración para ver detalles.</p>
        </div>
      </div>
    );
  }

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
        <MonthlyBalanceButton 
          transactions={transactions} 
          accountId={currentAccount?.id || null} 
          accountName={currentAccount?.name || ''} 
        />
      </div>

      {/* Account Selector (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        {accounts.map(acc => {
          const isActive = acc.id === currentAccount?.id;
          return (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                isActive 
                  ? "bg-primary-600 text-white border-transparent shadow-md" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              {acc.type === 'savings' ? <PiggyBank className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
              {acc.name}
            </button>
          );
        })}
      </div>

      {/* Account Balance Summary */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-center mb-2">
           <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Saldo Actual</span>
           <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg">
              {currentAccount?.type === 'savings' ? <PiggyBank className="w-3 h-3 text-primary-400" /> : <Wallet className="w-3 h-3 text-slate-400" />}
              <span className="text-[10px] font-bold uppercase">{currentAccount?.name}</span>
           </div>
        </div>
        <div className="text-4xl font-bold">{formatCurrency(currentBalance)}</div>
      </div>

      <div className="space-y-8">
        <TransactionGroup
          title="Ingresos"
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
          transactions={filteredGroups.incomes}
          coupleSettings={coupleSettings}
        />
        <TransactionGroup
          title="Gastos Fijos"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          transactions={filteredGroups.fixed}
          coupleSettings={coupleSettings}
        />
        <TransactionGroup
          title="Gastos Variables"
          icon={<TrendingDown className="w-4 h-4 text-blue-500" />}
          transactions={filteredGroups.variable}
          coupleSettings={coupleSettings}
        />

        {filteredGroups.incomes.length === 0 && filteredGroups.fixed.length === 0 && filteredGroups.variable.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <div className="text-slate-400 text-sm">No hay movimientos en esta cuenta</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
