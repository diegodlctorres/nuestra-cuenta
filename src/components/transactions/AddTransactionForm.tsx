import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Transaction, Category, Account, TransactionType, RecurrenceType } from '../../types';
import { Modal } from '../ui/Modal';

export function AddTransactionForm({ onAdd, categories, accounts }: { onAdd: (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => void, categories: Category[], accounts: Account[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Asignar primer ID disponible por default
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [isPetRelated, setIsPetRelated] = useState(false);

  // Filtrar categorías según tipo (income / expense)
  const filteredCategories = categories.filter(c => c.kind === type);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
    if (accounts.length > 0 && !accounts.find(a => a.id === accountId)) {
      setAccountId(accounts[0].id);
    }
  }, [type, filteredCategories, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !accountId) return;
    onAdd({
      amount: Math.abs(parseFloat(amount)),
      description,
      account_id: accountId,
      type,
      category_id: categoryId || undefined,
      recurrence: recurrence,
      is_pet_related: isPetRelated,
      date: new Date().toISOString(),
    });
    setAmount('');
    setDescription('');
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-6 bg-white rounded-3xl border border-slate-200 flex justify-between items-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-xl">
            <Plus className="w-6 h-6 text-primary-600" />
          </div>
          Nueva Transacción
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nueva Transacción">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cuenta de Origen / Destino</label>
            <div className="grid grid-cols-2 gap-2">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setAccountId(acc.id)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold border transition-all truncate px-2",
                    accountId === acc.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Movimiento</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-all",
                  type === 'income' ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-500 border-slate-200"
                )}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-all",
                  type === 'expense' ? "bg-secondary-600 text-white border-secondary-600" : "bg-white text-slate-500 border-slate-200"
                )}
              >
                Egreso
              </button>
            </div>
          </div>

          {/* 
            Como usamos 'created_by' de PostgreSQL, ya no necesitamos preguntar 
            '¿Quién lo hizo?'. Eso lo registra el Backend de forma automática.
          */}

          {type === 'expense' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Periodicidad</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecurrence('variable')}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold border transition-all",
                    recurrence === 'variable' ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  Variable
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrence('fixed')}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold border transition-all",
                    recurrence === 'fixed' ? "bg-amber-600 text-white border-amber-600" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  Fijo
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Monto</label>
            <input
              type="number"
              placeholder="Monto (ej: -50 o 100)"
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary-500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
            <input
              type="text"
              placeholder="¿En qué se usó?"
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary-500"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría</label>
            <select
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary-500"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="is_pet"
              checked={isPetRelated} 
              onChange={e => setIsPetRelated(e.target.checked)} 
              className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_pet" className="text-xs font-bold text-slate-600">Este es un gasto relacionado a mascotas</label>
          </div>

          <button type="submit" className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-100 mt-4">
            Guardar Transacción
          </button>
        </form>
      </Modal>
    </>
  );
}
