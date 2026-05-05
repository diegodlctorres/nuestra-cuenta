import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Clock, Wallet } from 'lucide-react';
import { parseISO } from 'date-fns';
import { MonthlyBalanceButton } from '../components/transactions/MonthlyBalanceButton';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { cn, formatCurrency } from '../lib/utils';
import { getAccountEmoji } from '../lib/accountEmojis';
import { useFinance } from '../contexts/FinanceContext';
import { useSettingsContext } from '../contexts/SettingsContext';
import { useAppNavigation } from '../contexts/AppNavigationContext';

export function DetailView() {
  const { transactions, accounts, accountBalances, deleteTransaction } = useFinance();
  const { coupleSettings } = useSettingsContext();
  const { selectedAccountId, setSelectedAccountId } = useAppNavigation();
  
  // Si no hay cuenta seleccionada, seleccionamos la primera disponible
  useEffect(() => {
    const firstAccount = accounts[0];
    if (!selectedAccountId && firstAccount) {
      setSelectedAccountId(firstAccount.id);
    }
  }, [accounts, selectedAccountId, setSelectedAccountId]);

  const currentAccount = useMemo(() => 
    accounts.find(a => a.id === selectedAccountId) || accounts[0]
  , [accounts, selectedAccountId]);

  const currentBalance = useMemo(() => 
    currentAccount ? (accountBalances[currentAccount.id] || 0) : 0
  , [currentAccount, accountBalances]);

  const currentMonthTransactions = useMemo(() => {
    if (!currentAccount) return [];

    const accountTransactions = transactions.filter(t => t.account_id === currentAccount.id);
    const now = new Date();

    return accountTransactions
      .filter(t => {
        const date = parseISO(t.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .sort((a, b) => (b.created_at || b.date).localeCompare(a.created_at || a.date));
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
          coupleSettings={coupleSettings}
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
              <span className="text-base leading-none">{getAccountEmoji(acc)}</span>
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
              <span className="text-sm leading-none">{getAccountEmoji(currentAccount)}</span>
              <span className="text-[10px] font-bold uppercase">{currentAccount?.name}</span>
           </div>
        </div>
        <div className="text-4xl font-bold">{formatCurrency(currentBalance)}</div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Movimientos del mes actual</h3>
        </div>

        {currentMonthTransactions.length > 0 ? (
          <div className="space-y-3">
            {currentMonthTransactions.map(transaction => (
              <TransactionItem
                key={transaction.id}
                t={transaction}
                coupleSettings={coupleSettings}
                showAccount={false}
                onDelete={deleteTransaction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <div className="text-slate-400 text-sm">No hay movimientos en esta cuenta durante el mes actual</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
