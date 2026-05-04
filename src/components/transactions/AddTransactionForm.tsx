import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Transaction, Category, Account, TransactionType } from '../../types';
import { Modal } from '../ui/Modal';
import { getAccountEmoji } from '../../lib/accountEmojis';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => Promise<boolean>;
  categories: Category[];
  accounts: Account[];
  initialDescription?: string;
  title?: string;
}

export function TransactionModal({
  isOpen,
  onClose,
  onAdd,
  categories,
  accounts,
  initialDescription = '',
  title = 'Nueva Transacción'
}: TransactionModalProps) {
  const MAX_DESCRIPTION_LENGTH = 256;
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [amountDigits, setAmountDigits] = useState('');
  const [amountLimitError, setAmountLimitError] = useState(false);
  const [description, setDescription] = useState(initialDescription);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Asignar primer ID disponible por default
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isPetRelated, setIsPetRelated] = useState(false);

  // Filtrar categorías según tipo (income / expense)
  const MAX_AMOUNT_CENTS = '9007199254740991';
  const filteredCategories = categories.filter(c => c.kind === type);
  const formatAmountFromDigits = (digits: string) => {
    if (!digits) return '';

    const normalizedDigits = digits.replace(/^0+(?=\d)/, '') || '0';
    const integerPart = normalizedDigits.slice(0, -2) || '0';
    const decimalPart = normalizedDigits.slice(-2).padStart(2, '0');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return `${formattedInteger}.${decimalPart}`;
  };
  const amount = formatAmountFromDigits(amountDigits);
  const normalizedAmount = amount.replace(/,/g, '');
  const amountNumber = Number(normalizedAmount);
  const amountError = !amountDigits || Number.isNaN(amountNumber) || amountNumber <= 0 || amountLimitError;
  const descriptionError = type === 'expense' && description.trim().length === 0;
  const descriptionLimitError = description.length > MAX_DESCRIPTION_LENGTH;
  const accountError = accountId.length === 0;
  const hasErrors = amountError || descriptionError || descriptionLimitError || accountError;
  const selectedAccount = accounts.find(acc => acc.id === accountId);

  const inputClassName = (hasError: boolean) => cn(
    "w-full p-3 rounded-xl border text-sm transition focus:outline-none",
    hasError
      ? "border-red-300 bg-red-50 text-slate-900 focus:ring-2 focus:ring-red-200"
      : "border-transparent bg-slate-50 text-slate-900 focus:ring-2 focus:ring-primary-500"
  );

  const resetForm = () => {
    setAmountDigits('');
    setAmountLimitError(false);
    setDescription(initialDescription);
    setIsPetRelated(false);
    setSubmitAttempted(false);
    setIsAccountPickerOpen(false);
    setSaveError('');
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
    if (isOpen) {
      setDescription(initialDescription);
    }
  }, [initialDescription, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setSaveError('');
    if (hasErrors || isSaving) return;

    const finalDescription =
      type === 'income'
        ? `Ingreso por ${filteredCategories.find(category => category.id === categoryId)?.name || 'categoría'}`
        : description.trim();

    setIsSaving(true);
    const wasSaved = await onAdd({
      created_at: new Date().toISOString(),
      amount: Math.abs(amountNumber),
      description: finalDescription,
      account_id: accountId,
      type,
      category_id: categoryId || undefined,
      is_pet_related: isPetRelated,
      date: new Date().toISOString(),
    });
    setIsSaving(false);

    if (wasSaved) {
      resetForm();
      onClose();
    } else {
      setSaveError('No se pudo guardar la transacción. Inténtalo nuevamente.');
    }
  };

  return (
      <Modal isOpen={isOpen} onClose={() => { if (!isSaving) { onClose(); setSubmitAttempted(false); setSaveError(''); } }} title={title}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && accountError ? "text-red-500" : "text-slate-400")}>Cuenta de Origen / Destino</label>
            <div className="relative z-20">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsAccountPickerOpen(prev => !prev)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition",
                  submitAttempted && accountError
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-transparent bg-slate-50 text-slate-900"
                )}
                >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm text-lg">
                    {getAccountEmoji(selectedAccount)}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="font-bold truncate">
                      {selectedAccount?.name || 'Selecciona una cuenta'}
                    </div>
                  </div>
                </div>
                <ChevronDown className={cn("w-4 h-4 shrink-0 text-slate-400 transition-transform", isAccountPickerOpen && "rotate-180")} />
              </button>

              {isAccountPickerOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="space-y-1">
                    {accounts.map(acc => (
                      <button
                        key={acc.id}
                        type="button"
                        disabled={isSaving}
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
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-lg">
                            {getAccountEmoji(acc)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-700 truncate">{acc.name}</div>
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
                disabled={isSaving}
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
                disabled={isSaving}
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
            <div className="flex items-center gap-3">
              <label className={cn("w-20 shrink-0 text-[10px] font-bold uppercase ml-1", submitAttempted && amountError ? "text-red-500" : "text-slate-400")}>Monto</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0.00"
                className={cn(inputClassName(submitAttempted && amountError), "text-right tabular-nums")}
                value={amount}
                disabled={isSaving}
                onChange={e => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  const normalizedDigits = digitsOnly.replace(/^0+(?=\d)/, '') || digitsOnly;
                  const exceedsMax =
                    normalizedDigits.length > MAX_AMOUNT_CENTS.length
                    || (
                      normalizedDigits.length === MAX_AMOUNT_CENTS.length
                      && normalizedDigits > MAX_AMOUNT_CENTS
                    );

                  if (exceedsMax) {
                    setAmountLimitError(true);
                    return;
                  }

                  setAmountLimitError(false);
                  setAmountDigits(normalizedDigits);
                }}
                aria-invalid={submitAttempted && amountError}
              />
            </div>
            {submitAttempted && !amountLimitError && amountError && (
              <p className="text-xs text-red-500 ml-1">Ingresa un monto mayor a 0.</p>
            )}
            {submitAttempted && amountLimitError && (
              <p className="text-xs text-red-500 ml-1">El monto excede el máximo soportado por la app.</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <label className="w-20 shrink-0 text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría</label>
              <select
                className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary-500"
                value={categoryId}
                disabled={isSaving}
                onChange={e => setCategoryId(e.target.value)}
              >
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {type === 'expense' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && (descriptionError || descriptionLimitError) ? "text-red-500" : "text-slate-400")}>Descripción</label>
                <span className={cn("text-[10px] font-bold", submitAttempted && descriptionLimitError ? "text-red-500" : "text-slate-400")}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
              <textarea
                placeholder="¿En qué se usó?"
                className={cn(
                  inputClassName(submitAttempted && (descriptionError || descriptionLimitError)),
                  "min-h-[84px] max-h-[84px] resize-none"
                )}
                value={description}
                disabled={isSaving}
                maxLength={MAX_DESCRIPTION_LENGTH}
                onChange={e => setDescription(e.target.value)}
                aria-invalid={submitAttempted && (descriptionError || descriptionLimitError)}
                rows={3}
              />
              {submitAttempted && descriptionError && (
                <p className="text-xs text-red-500 ml-1">La descripción es obligatoria.</p>
              )}
              {submitAttempted && descriptionLimitError && (
                <p className="text-xs text-red-500 ml-1">La descripción no puede superar los 256 caracteres.</p>
              )}
            </div>
          )}
          
          {saveError && (
            <p className="text-xs text-red-500 ml-1">{saveError}</p>
          )}

          <button type="submit" disabled={isSaving} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-100 mt-4 disabled:opacity-60 disabled:cursor-not-allowed">
            {isSaving ? 'Guardando...' : 'Guardar Transacción'}
          </button>
        </form>
      </Modal>
  );
}

export function AddTransactionForm({ onAdd, categories, accounts }: { onAdd: (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => Promise<boolean>, categories: Category[], accounts: Account[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAdd={onAdd}
        categories={categories}
        accounts={accounts}
      />

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom,0px))] right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-2xl shadow-primary-200 transition-colors hover:bg-primary-700 active:scale-95"
        aria-label="Nueva transacción"
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
}
