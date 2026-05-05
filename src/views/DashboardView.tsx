import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PawPrint, Layers3, ChevronRight } from 'lucide-react';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { Modal } from '../components/ui/Modal';
import { cn, formatCurrency } from '../lib/utils';
import { getAccountEmoji } from '../lib/accountEmojis';
import { useFinance } from '../contexts/FinanceContext';
import { usePetsContext } from '../contexts/PetsContext';
import { useSettingsContext } from '../contexts/SettingsContext';
import { useAppNavigation } from '../contexts/AppNavigationContext';

export function DashboardView() {
  const { transactions, accounts, accountBalances } = useFinance();
  const { pendingPetTasksCount } = usePetsContext();
  const { coupleSettings } = useSettingsContext();
  const { setActiveTab, setSelectedAccountId } = useAppNavigation();
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const featuredAccounts = accounts.slice(0, 2);
  const groupedAccounts = accounts.slice(2);

  const openAccountDetail = (accountId: string) => {
    setSelectedAccountId(accountId);
    setActiveTab('detail');
    setIsAccountsModalOpen(false);
  };

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Dynamic Account Cards */}
      <div className="grid grid-cols-1 gap-4">
        {featuredAccounts.map((acc, index) => {
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
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl", isPrimary ? "bg-white/20" : "bg-slate-100")}>
                  {getAccountEmoji(acc)}
                </div>
                <div className="min-w-0 text-sm font-bold tracking-tight truncate">{acc.name}</div>
              </div>
              <div className="text-3xl font-bold mb-1">{formatCurrency(balance)}</div>
              <div className={cn("text-sm", isPrimary ? "text-primary-100" : "text-slate-500")}>
                Haz clic para ver el detalle
              </div>
            </div>
          );
        })}

        {groupedAccounts.length > 0 && (
          <button
            type="button"
            onClick={() => setIsAccountsModalOpen(true)}
            className="rounded-3xl p-4 bg-white text-slate-900 border border-slate-200 shadow-slate-100 shadow-sm text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-100">
                  <Layers3 className="w-5 h-5 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-700">
                    Ver todas las cuentas restantes
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {groupedAccounts.length} cuenta{groupedAccounts.length > 1 ? 's' : ''} adicional{groupedAccounts.length > 1 ? 'es' : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                  +{groupedAccounts.length}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </button>
        )}

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

      <Modal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        title="Otras cuentas"
      >
        <div className="space-y-3">
          {groupedAccounts.map((account) => {
            const balance = accountBalances[account.id] || 0;

            return (
              <button
                key={account.id}
                type="button"
                onClick={() => openAccountDetail(account.id)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <span className="text-xl">{getAccountEmoji(account)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-700 text-sm truncate">{account.name}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-800">{formatCurrency(balance)}</div>
                    <div className="text-xs text-slate-400 mt-1">Ver detalle</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      <button
        type="button"
        onClick={() => setActiveTab('pets')}
        className="w-full text-left bg-secondary-50 rounded-3xl p-6 border border-secondary-100 transition-all active:scale-[0.98] hover:bg-secondary-100"
      >
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
      </button>

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
