import React, { useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn, formatCurrency } from '../../lib/utils';
import { Transaction, CoupleSettings } from '../../types';

export const TransactionItem: React.FC<{
  t: Transaction,
  coupleSettings: CoupleSettings,
  showRecurrence?: boolean,
  showAccount?: boolean,
  onDelete?: (id: string) => void
}> = ({ t, coupleSettings, showRecurrence = true, showAccount = true, onDelete }) => {
  const isIncome = t.type === 'income';
  const timestamp = t.created_at || t.date;
  const displayDescription =
    isIncome && t.category?.name && t.description.toLowerCase().startsWith('ingreso a ')
      ? `Ingreso por ${t.category.name}`
      : t.description;
  const [offsetX, setOffsetX] = useState(0);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const startXRef = useRef<number | null>(null);
  const dragStartOffsetRef = useRef(0);
  const SWIPE_ACTION_WIDTH = 96;
  const SWIPE_THRESHOLD = 48;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!onDelete) return;
    startXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetX;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!onDelete || startXRef.current === null) return;
    const deltaX = event.clientX - startXRef.current;
    const nextOffset = Math.max(-SWIPE_ACTION_WIDTH, Math.min(0, dragStartOffsetRef.current + deltaX));
    setOffsetX(nextOffset);
  };

  const handlePointerEnd = () => {
    if (!onDelete || startXRef.current === null) return;
    const shouldOpen = offsetX <= -SWIPE_THRESHOLD;
    setOffsetX(shouldOpen ? -SWIPE_ACTION_WIDTH : 0);
    setIsSwipeOpen(shouldOpen);
    startXRef.current = null;
  };

  const closeSwipe = () => {
    setOffsetX(0);
    setIsSwipeOpen(false);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete(t.id);
    closeSwipe();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {onDelete && (
        <div className="absolute inset-y-0 right-0 flex items-stretch">
          <button
            type="button"
            onClick={handleDelete}
            className="w-24 bg-secondary-600 text-white text-xs font-bold uppercase tracking-wider"
          >
            Eliminar
          </button>
        </div>
      )}
      <div
        className={cn(
          "bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm transition-transform",
          onDelete && "touch-pan-y"
        )}
        style={{ transform: `translateX(${offsetX}px)`, touchAction: onDelete ? 'pan-y' : undefined }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onClick={() => {
          if (isSwipeOpen) {
            closeSwipe();
          }
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "p-2 rounded-xl shrink-0",
            isIncome ? "bg-emerald-50 text-emerald-600" : "bg-secondary-50 text-secondary-600"
          )}>
            {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm text-slate-800 truncate">
              {displayDescription}
            </div>
            {t.creator && (
              <div className="mt-1">
                <span className={cn(
                  "inline-flex text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                  "bg-primary-100 text-primary-700"
                )}>
                  {t.creator.name}
                </span>
              </div>
            )}
            <div className="text-xs text-slate-400 truncate">
              {format(parseISO(timestamp), 'dd/MM/yyyy HH:mm')}
              {showRecurrence && t.category?.name ? ` • ${t.category.name}` : ''}
              {showAccount && t.account?.name ? ` • ${t.account.name}` : ''}
            </div>
          </div>
        </div>
        <div className={cn("font-bold shrink-0 ml-3", isIncome ? "text-emerald-600" : "text-secondary-600")}>
          {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
        </div>
      </div>
    </div>
  );
}
