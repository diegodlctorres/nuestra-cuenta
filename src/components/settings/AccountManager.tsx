import React, { useState } from 'react';
import { Plus, Trash2, Wallet, PiggyBank, Pencil, Check, X } from 'lucide-react';
import { Account, AccountType } from '../../types';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

interface AccountManagerProps {
  accounts: Account[];
  onAdd: (name: string, type: AccountType) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Account>) => void;
}

export function AccountManager({ accounts, onAdd, onDelete, onUpdate }: AccountManagerProps) {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('checking');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState<AccountType>('checking');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAdd(newName.trim(), newType);
      setNewName('');
    }
  };

  const handleConfirmDelete = () => {
    if (!accountToDelete) return;
    onDelete(accountToDelete.id);
    setAccountToDelete(null);
  };

  const startEditing = (account: Account) => {
    setEditingAccountId(account.id);
    setEditingName(account.name);
    setEditingType(account.type);
  };

  const cancelEditing = () => {
    setEditingAccountId(null);
    setEditingName('');
    setEditingType('checking');
  };

  const saveEditing = (account: Account) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) return;

    if (trimmedName !== account.name || editingType !== account.type) {
      onUpdate(account.id, {
        name: trimmedName,
        type: editingType
      });
    }

    cancelEditing();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Cuentas Bancarias / Billeteras</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-[10px] font-bold text-primary-600 uppercase tracking-wider"
        >
          Gestionar ({accounts.length})
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre (ej: BCP, BBVA, Efectivo)"
            className="flex-1 p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary-500"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="p-3 bg-primary-600 text-white rounded-xl disabled:opacity-50 transition-opacity"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNewType('checking')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all",
              newType === 'checking' ? "bg-primary-50 border-primary-200 text-primary-700" : "bg-white border-slate-100 text-slate-500"
            )}
          >
            <Wallet className="w-4 h-4" />
            Corriente/Día
          </button>
          <button
            type="button"
            onClick={() => setNewType('savings')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all",
              newType === 'savings' ? "bg-primary-50 border-primary-200 text-primary-700" : "bg-white border-slate-100 text-slate-500"
            )}
          >
            <PiggyBank className="w-4 h-4" />
            Ahorros/Metas
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {accounts.slice(0, 3).map(acc => (
          <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {acc.type === 'savings' ? <PiggyBank className="w-4 h-4 text-primary-500" /> : <Wallet className="w-4 h-4 text-slate-500" />}
              </div>
              <span className="text-sm font-bold text-slate-700">{acc.name}</span>
            </div>
            <button
              onClick={() => setAccountToDelete(acc)}
              className="p-2 text-slate-400 hover:text-secondary-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gestionar Cuentas">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  {acc.type === 'savings' ? <PiggyBank className="w-5 h-5 text-primary-500" /> : <Wallet className="w-5 h-5 text-slate-500" />}
                </div>
                {editingAccountId === acc.id ? (
                  <div className="flex-1 space-y-3 min-w-0">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingType('checking')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all",
                          editingType === 'checking' ? "bg-primary-50 border-primary-200 text-primary-700" : "bg-white border-slate-200 text-slate-500"
                        )}
                      >
                        <Wallet className="w-4 h-4" />
                        Corriente/Día
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingType('savings')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all",
                          editingType === 'savings' ? "bg-primary-50 border-primary-200 text-primary-700" : "bg-white border-slate-200 text-slate-500"
                        )}
                      >
                        <PiggyBank className="w-4 h-4" />
                        Ahorros/Metas
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <div className="font-bold text-slate-700 text-sm truncate">{acc.name}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                      {acc.type === 'savings' ? 'Ahorros/Metas' : 'Corriente/Día'}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 ml-3">
                {editingAccountId === acc.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => saveEditing(acc)}
                      className="p-2 text-slate-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditing(acc)}
                    className="p-2 text-slate-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAccountToDelete(acc)}
                  className="p-2 text-slate-400 hover:text-secondary-500 transition-colors rounded-lg hover:bg-secondary-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm italic">
              No hay cuentas registradas. Crea una arriba.
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        title="Confirmar eliminación"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-secondary-100 bg-secondary-50 p-4">
            <p className="text-sm font-semibold text-secondary-700">
              Vas a eliminar la cuenta {accountToDelete ? `"${accountToDelete.name}"` : ''}.
            </p>
            <p className="mt-2 text-sm text-secondary-600">
              Esta acción también eliminará sus transacciones asociadas y no se puede deshacer.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAccountToDelete(null)}
              className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="flex-1 rounded-2xl bg-secondary-600 py-3 text-sm font-bold text-white shadow-lg shadow-secondary-100 transition-colors hover:bg-secondary-700"
            >
              Eliminar cuenta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
