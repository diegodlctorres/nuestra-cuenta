import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { parseISO } from 'date-fns';
import { cn, formatCurrency } from '../../lib/utils';
import { Transaction, AccountType } from '../../types';
import { Modal } from '../ui/Modal';

export function MonthlyBalanceButton({ transactions, account }: { transactions: Transaction[], account: AccountType }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const filteredTransactions = transactions.filter(t => {
    const date = parseISO(t.date);
    return t.account === account &&
      date.getMonth() === selectedMonth &&
      date.getFullYear() === selectedYear;
  });

  const totalIncomes = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenseCategoryTotals = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const sortedCategories = Object.entries(expenseCategoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
        title="Balance Mensual"
      >
        <Calendar className="w-5 h-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Balance ${account === 'savings' ? 'Ahorros' : 'Gastos'}`}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mes</label>
              <select
                className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
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
                className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
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
            <div className="bg-emerald-50 rounded-3xl p-4 border border-emerald-100 text-center">
              <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-1">Ingresos</div>
              <div className="text-lg font-bold text-emerald-700">{formatCurrency(totalIncomes)}</div>
            </div>
            <div className="bg-rose-50 rounded-3xl p-4 border border-rose-100 text-center">
              <div className="text-rose-600 text-[10px] font-bold uppercase tracking-wider mb-1">Egresos</div>
              <div className="text-lg font-bold text-rose-700">{formatCurrency(totalExpenses)}</div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white text-center">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Balance Neto</div>
            <div className={cn(
              "text-3xl font-bold",
              (totalIncomes - totalExpenses) >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {formatCurrency(totalIncomes - totalExpenses)}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Egresos por Categoría</h4>
            {sortedCategories.length > 0 ? (
              <div className="space-y-2">
                {sortedCategories.map(([category, amount]) => (
                  <div key={category} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{category}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0}% del total
                      </span>
                    </div>
                    <span className="font-bold text-rose-600">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm italic">
                No hay egresos en este periodo
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
