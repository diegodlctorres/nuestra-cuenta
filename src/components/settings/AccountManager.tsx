import React, { useState } from 'react';
import { Plus, Trash2, Wallet, PiggyBank } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAdd(newName.trim(), newType);
      setNewName('');
    }
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
              onClick={() => {
                if(confirm(`¿Estás seguro de eliminar la cuenta "${acc.name}"? Se borrarán todas sus transacciones.`)) {
                  onDelete(acc.id);
                }
              }}
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
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  {acc.type === 'savings' ? <PiggyBank className="w-5 h-5 text-primary-500" /> : <Wallet className="w-5 h-5 text-slate-500" />}
                </div>
                <input
                  type="text"
                  className="bg-transparent border-none font-bold text-slate-700 focus:ring-0 p-0"
                  defaultValue={acc.name}
                  onBlur={(e) => {
                    if (e.target.value !== acc.name && e.target.value.trim()) {
                      onUpdate(acc.id, { name: e.target.value.trim() });
                    }
                  }}
                />
              </div>
              <button
                onClick={() => {
                   if(confirm(`¿Estás seguro de eliminar la cuenta "${acc.name}"? Se borrarán todas sus transacciones.`)) {
                    onDelete(acc.id);
                  }
                }}
                className="p-2 text-slate-400 hover:text-secondary-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm italic">
              No hay cuentas registradas. Crea una arriba.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
