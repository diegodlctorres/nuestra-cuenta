import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { CoupleSettings, Transaction } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { TransactionItem } from './TransactionItem';

interface CategoryBreakdownGroupProps {
  title: string;
  icon: React.ReactNode;
  transactions: Transaction[];
  coupleSettings: CoupleSettings;
  accent: 'income' | 'expense';
}

export function CategoryBreakdownGroup({
  title,
  icon,
  transactions,
  coupleSettings,
  accent
}: CategoryBreakdownGroupProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categoryGroups = useMemo(() => {
    const grouped = transactions.reduce((acc, transaction) => {
      const categoryName = transaction.category?.name || 'Sin categoría';
      const current = acc[categoryName] || { total: 0, transactions: [] as Transaction[] };

      current.total += Number(transaction.amount);
      current.transactions.push(transaction);
      acc[categoryName] = current;

      return acc;
    }, {} as Record<string, { total: number; transactions: Transaction[] }>);

    return Object.entries(grouped)
      .map(([category, data]) => ({
        category,
        total: data.total,
        transactions: data.transactions.sort((a, b) => (b.created_at || b.date).localeCompare(a.created_at || a.date))
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  if (transactions.length === 0) return null;

  const totalAmount = transactions.reduce((acc, transaction) => acc + Number(transaction.amount), 0);
  const previewCategories = categoryGroups.slice(0, 4);
  const toneClasses = accent === 'income'
    ? {
        badge: 'bg-emerald-50 text-emerald-600',
        amount: 'text-emerald-600',
        progress: 'bg-emerald-500'
      }
    : {
        badge: 'bg-secondary-50 text-secondary-600',
        amount: 'text-secondary-600',
        progress: 'bg-secondary-500'
      };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-[10px] font-bold text-primary-600 uppercase tracking-wider"
          >
            Ver detalle ({transactions.length})
          </button>
        </div>

        <div className="space-y-3">
          {previewCategories.map(group => {
            const percentage = totalAmount > 0 ? (group.total / totalAmount) * 100 : 0;

            return (
              <button
                key={group.category}
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase', toneClasses.badge)}>
                        {group.transactions.length} movimiento{group.transactions.length === 1 ? '' : 's'}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        {percentage.toFixed(1)}% del total
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-slate-800 truncate">{group.category}</div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', toneClasses.progress)}
                        style={{ width: `${Math.max(percentage, 6)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-sm font-bold', toneClasses.amount)}>{formatCurrency(group.total)}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${title} por categoría`}>
        <div className="space-y-5">
          {categoryGroups.map(group => {
            const percentage = totalAmount > 0 ? (group.total / totalAmount) * 100 : 0;

            return (
              <section key={group.category} className="space-y-3">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-800">{group.category}</div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-1">
                        {group.transactions.length} movimiento{group.transactions.length === 1 ? '' : 's'} • {percentage.toFixed(1)}% del total
                      </div>
                    </div>
                    <div className={cn('text-sm font-bold', toneClasses.amount)}>{formatCurrency(group.total)}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {group.transactions.map(transaction => (
                    <TransactionItem
                      key={transaction.id}
                      t={transaction}
                      coupleSettings={coupleSettings}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
