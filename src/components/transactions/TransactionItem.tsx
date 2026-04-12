import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatCurrency } from '../../lib/utils';
import { Transaction, CoupleSettings } from '../../types';

export const TransactionItem: React.FC<{ t: Transaction, coupleSettings: CoupleSettings, showRecurrence?: boolean }> = ({ t, coupleSettings, showRecurrence = true }) => {
  const isIncome = t.type === 'income';

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-xl",
          isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
        <div>
          <div className="font-medium text-sm flex items-center gap-2">
            {t.description}
            {showRecurrence && !isIncome && t.recurrence && (
              <span className={cn(
                "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                t.recurrence === 'fixed' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              )}>
                {t.recurrence === 'fixed' ? 'Fijo' : 'Variable'}
              </span>
            )}
            {isIncome && t.createdBy && coupleSettings.partner1 && coupleSettings.partner2 && (
               <span className={cn(
                 "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                 t.createdBy === coupleSettings.partner1.name ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-700"
               )}>
                 {t.createdBy}
               </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            {format(parseISO(t.date), showRecurrence ? 'dd MMMM yyyy' : 'dd MMM', { locale: es })} {showRecurrence && `• ${t.category}`} • {t.account === 'savings' ? 'Ahorros' : 'Gastos'}
          </div>
        </div>
      </div>
      <div className={cn("font-bold", isIncome ? "text-emerald-600" : "text-rose-600")}>
        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
      </div>
    </div>
  );
}
