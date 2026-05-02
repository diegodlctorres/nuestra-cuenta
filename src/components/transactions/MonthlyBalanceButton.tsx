import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { parseISO } from 'date-fns';
import { cn, formatCurrency } from '../../lib/utils';
import { Transaction, CoupleSettings } from '../../types';
import { Modal } from '../ui/Modal';
import { CategoryBreakdownGroup } from './CategoryBreakdownGroup';

export function MonthlyBalanceButton({
  transactions,
  accountId,
  accountName,
  coupleSettings
}: {
  transactions: Transaction[],
  accountId: string | null,
  accountName: string,
  coupleSettings: CoupleSettings
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBreakdown, setActiveBreakdown] = useState<'income' | 'expense' | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const filteredTransactions = transactions.filter(t => {
    const date = parseISO(t.date);
    
    return t.account_id === accountId &&
      date.getMonth() === selectedMonth &&
      date.getFullYear() === selectedYear;
  });

  const totalIncomes = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
        title="Balance Mensual"
      >
        <Calendar className="w-5 h-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Balance - ${accountName}`}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mes</label>
              <select
                className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary-500"
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Año</label>
              <select
                className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary-500"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setActiveBreakdown(prev => prev === 'income' ? null : 'income')}
              className={cn(
                "rounded-3xl p-4 border text-center transition-all",
                activeBreakdown === 'income'
                  ? "bg-emerald-100 border-emerald-300 ring-1 ring-emerald-300"
                  : "bg-emerald-50 border-emerald-100"
              )}
            >
              <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-1">Ingresos</div>
              <div className="text-lg font-bold text-emerald-700">{formatCurrency(totalIncomes)}</div>
            </button>
            <button
              type="button"
              onClick={() => setActiveBreakdown(prev => prev === 'expense' ? null : 'expense')}
              className={cn(
                "rounded-3xl p-4 border text-center transition-all",
                activeBreakdown === 'expense'
                  ? "bg-secondary-100 border-secondary-300 ring-1 ring-secondary-300"
                  : "bg-secondary-50 border-secondary-100"
              )}
            >
              <div className="text-secondary-600 text-[10px] font-bold uppercase tracking-wider mb-1">Egresos</div>
              <div className="text-lg font-bold text-secondary-700">{formatCurrency(totalExpenses)}</div>
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white text-center">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Balance Neto</div>
            <div className={cn(
              "text-3xl font-bold",
              (totalIncomes - totalExpenses) >= 0 ? "text-emerald-400" : "text-secondary-400"
            )}>
              {formatCurrency(totalIncomes - totalExpenses)}
            </div>
          </div>

          <div className="space-y-8">
            {activeBreakdown === 'income' && (
              <CategoryBreakdownGroup
                title="Ingresos"
                icon={<span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />}
                transactions={incomeTransactions}
                coupleSettings={coupleSettings}
                accent="income"
              />
            )}
            {activeBreakdown === 'expense' && (
              <CategoryBreakdownGroup
                title="Egresos"
                icon={<span className="inline-flex h-2 w-2 rounded-full bg-secondary-500" />}
                transactions={expenseTransactions}
                coupleSettings={coupleSettings}
                accent="expense"
              />
            )}
            {incomeTransactions.length === 0 && expenseTransactions.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm italic">
                No hay movimientos en este periodo
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
