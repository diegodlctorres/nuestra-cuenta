import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Check, PiggyBank, Wallet } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Transaction, Category, Account, TransactionType, RecurrenceType } from '../../types';
import { Modal } from '../ui/Modal';

export function AddTransactionForm({ onAdd, categories, accounts }: { onAdd: (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => void, categories: Category[], accounts: Account[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  // Asignar primer ID disponible por default
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('variable');
  const [isPetRelated, setIsPetRelated] = useState(false);

  // Filtrar categorías según tipo (income / expense)
  const filteredCategories = categories.filter(c => c.kind === type);
  const amountNumber = Number(amount);
  const amountError = !amount || Number.isNaN(amountNumber) || amountNumber <= 0;
  const descriptionError = type === 'expense' && description.trim().length === 0;
  const accountError = accountId.length === 0;
  const hasErrors = amountError || descriptionError || accountError;
  const selectedAccount = accounts.find(acc => acc.id === accountId);

  const inputClassName = (hasError: boolean) => cn(
    "w-full p-3 rounded-xl border text-sm transition focus:outline-none",
    hasError
      ? "border-red-300 bg-red-50 text-slate-900 focus:ring-2 focus:ring-red-200"
      : "border-transparent bg-slate-50 text-slate-900 focus:ring-2 focus:ring-primary-500"
  );

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setIsPetRelated(false);
    setRecurrence('variable');
    setSubmitAttempted(false);
    setIsAccountPickerOpen(false);
  };

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
    if (accounts.length > 0 && !accounts.find(a => a.id === accountId)) {
      setAccountId(accounts[0].id);
    }
  }, [type, filteredCategories, accounts, categoryId, accountId]);

  useEffect(() => {
    if (type === 'expense' && recurrence === 'none') {
      setRecurrence('variable');
    }
  }, [type, recurrence]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (hasErrors) return;

    const finalDescription =
      type === 'income'
        ? `Ingreso a ${selectedAccount?.name || 'cuenta'}`
        : description.trim();

    onAdd({
      amount: Math.abs(amountNumber),
      description: finalDescription,
      account_id: accountId,
      type,
      category_id: categoryId || undefined,
      recurrence: type === 'expense' ? 'variable' : 'none',
      is_pet_related: isPetRelated,
      date: new Date().toISOString(),
    });
    resetForm();
    setIsOpen(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setSubmitAttempted(false); }} title="Nueva Transacción">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && accountError ? "text-red-500" : "text-slate-400")}>Cuenta de Origen / Destino</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountPickerOpen(prev => !prev)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition",
                  submitAttempted && accountError
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-transparent bg-slate-50 text-slate-900"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {selectedAccount?.type === 'savings' ? (
                      <PiggyBank className="w-4 h-4 text-primary-500" />
                    ) : (
                      <Wallet className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="font-bold truncate">
                      {selectedAccount?.name || 'Selecciona una cuenta'}
                    </div>
                    {selectedAccount && (
                      <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                        {selectedAccount.type === 'savings' ? 'Ahorros / Metas' : 'Día a Día'}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown className={cn("w-4 h-4 shrink-0 text-slate-400 transition-transform", isAccountPickerOpen && "rotate-180")} />
              </button>

              {isAccountPickerOpen && (
                <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="space-y-1">
                    {accounts.map(acc => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setAccountId(acc.id);
                          setIsAccountPickerOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                          accountId === acc.id ? "bg-primary-50" : "hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-slate-50 rounded-lg">
                            {acc.type === 'savings' ? (
                              <PiggyBank className="w-4 h-4 text-primary-500" />
                            ) : (
                              <Wallet className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-700 truncate">{acc.name}</div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                              {acc.type === 'savings' ? 'Ahorros / Metas' : 'Día a Día'}
                            </div>
                          </div>
                        </div>
                        {accountId === acc.id && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {submitAttempted && accountError && (
              <p className="text-xs text-red-500 ml-1">Selecciona una cuenta para registrar la transacción.</p>
            )}
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

          <div className="space-y-1">
            <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && amountError ? "text-red-500" : "text-slate-400")}>Monto</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Monto (ej: 50 o 100)"
              className={inputClassName(submitAttempted && amountError)}
              value={amount}
              onChange={e => {
                const sanitized = e.target.value
                  .replace(/,/g, '.')
                  .replace(/[^0-9.]/g, '')
                  .replace(/(\..*)\./g, '$1');
                setAmount(sanitized);
              }}
              aria-invalid={submitAttempted && amountError}
            />
            {submitAttempted && amountError && (
              <p className="text-xs text-red-500 ml-1">Ingresa un monto mayor a 0.</p>
            )}
          </div>

          {type === 'expense' && (
            <div className="space-y-1">
              <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && descriptionError ? "text-red-500" : "text-slate-400")}>Descripción</label>
              <input
                type="text"
                placeholder="¿En qué se usó?"
                className={inputClassName(submitAttempted && descriptionError)}
                value={description}
                onChange={e => setDescription(e.target.value)}
                aria-invalid={submitAttempted && descriptionError}
              />
              {submitAttempted && descriptionError && (
                <p className="text-xs text-red-500 ml-1">La descripción es obligatoria.</p>
              )}
            </div>
          )}

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
          
          <button type="submit" className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-100 mt-4">
            Guardar Transacción
          </button>
        </form>
      </Modal>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-2xl shadow-primary-200 transition-colors hover:bg-primary-700 active:scale-95"
        aria-label="Nueva transacción"
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
}
