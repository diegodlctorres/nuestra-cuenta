import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Transaction, Category, CoupleSettings, AccountType, TransactionType, RecurrenceType } from '../../types';
import { Modal } from '../ui/Modal';

export function AddTransactionForm({ onAdd, categories, coupleSettings }: { onAdd: (t: Omit<Transaction, 'id'>) => void, categories: Category[], coupleSettings: CoupleSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [account, setAccount] = useState<AccountType>('expenses');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('variable');
  const [createdBy, setCreatedBy] = useState<string>(coupleSettings.partner1.name);

  const filteredCategories = categories.filter(c => c.type === account);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.name === category)) {
      setCategory(filteredCategories[0].name);
    }
  }, [account, filteredCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onAdd({
      amount: Math.abs(parseFloat(amount)),
      description,
      account,
      type,
      category: category || 'General',
      recurrence: type === 'expense' ? recurrence : undefined,
      createdBy: type === 'income' ? createdBy : undefined,
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
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Plus className="w-6 h-6 text-indigo-600" />
          </div>
          Nueva Transacción
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nueva Transacción">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cuenta</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccount('expenses')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-all",
                  account === 'expenses' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"
                )}
              >
                Gastos
              </button>
              <button
                type="button"
                onClick={() => setAccount('savings')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-all",
                  account === 'savings' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200"
                )}
              >
                Ahorros
              </button>
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
                  type === 'expense' ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-500 border-slate-200"
                )}
              >
                Egreso
              </button>
            </div>
          </div>

          {type === 'income' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">¿Quién lo hizo?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCreatedBy(coupleSettings.partner1.name)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold border transition-all truncate px-2",
                    createdBy === coupleSettings.partner1.name ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  {coupleSettings.partner1.name}
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedBy(coupleSettings.partner2.name)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold border transition-all truncate px-2",
                    createdBy === coupleSettings.partner2.name ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  {coupleSettings.partner2.name}
                </button>
              </div>
            </div>
          )}

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
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
            <input
              type="text"
              placeholder="¿En qué se usó?"
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría</label>
            <select
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {filteredCategories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 mt-4">
            Guardar Transacción
          </button>
        </form>
      </Modal>
    </>
  );
}
