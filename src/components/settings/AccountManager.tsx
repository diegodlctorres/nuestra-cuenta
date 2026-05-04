import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Account } from '../../types';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { ACCOUNT_EMOJI_OPTIONS, getAccountEmoji, getDefaultAccountEmoji } from '../../lib/accountEmojis';

interface AccountManagerProps {
  accounts: Account[];
  onAdd: (name: string, emoji: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<Account>) => void;
}

function EmojiPickerGrid({
  selectedEmoji,
  onSelect
}: {
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {ACCOUNT_EMOJI_OPTIONS.map(emoji => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={cn(
            'flex h-11 items-center justify-center rounded-xl border text-xl transition-colors',
            selectedEmoji === emoji
              ? 'border-primary-300 bg-primary-50'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          )}
        >
          <span>{emoji}</span>
        </button>
      ))}
    </div>
  );
}

function EmojiPickerModal({
  isOpen,
  selectedEmoji,
  title,
  onClose,
  onSelect
}: {
  isOpen: boolean;
  selectedEmoji: string;
  title: string;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="text-sm text-slate-500">
          Elige el emoji que mejor represente esta cuenta.
        </div>
        <EmojiPickerGrid
          selectedEmoji={selectedEmoji}
          onSelect={(emoji) => {
            onSelect(emoji);
            onClose();
          }}
        />
      </div>
    </Modal>
  );
}

export function AccountManager({ accounts, onAdd, onDelete, onUpdate }: AccountManagerProps) {
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState(getDefaultAccountEmoji());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingEmoji, setEditingEmoji] = useState(getDefaultAccountEmoji());
  const [isNewEmojiModalOpen, setIsNewEmojiModalOpen] = useState(false);
  const [isEditingEmojiModalOpen, setIsEditingEmojiModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAdd(newName.trim(), newEmoji);
      setNewName('');
      setNewEmoji(getDefaultAccountEmoji());
    }
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete || isDeletingAccount) return;
    setIsDeletingAccount(true);
    const wasDeleted = await onDelete(accountToDelete.id);
    setIsDeletingAccount(false);
    if (wasDeleted) {
      setAccountToDelete(null);
    }
  };

  const startEditing = (account: Account) => {
    setEditingAccountId(account.id);
    setEditingName(account.name);
    setEditingEmoji(getAccountEmoji(account));
  };

  const cancelEditing = () => {
    setEditingAccountId(null);
    setEditingName('');
    setEditingEmoji(getDefaultAccountEmoji());
  };

  const saveEditing = (account: Account) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) return;

    if (trimmedName !== account.name || editingEmoji !== getAccountEmoji(account)) {
      onUpdate(account.id, {
        name: trimmedName,
        emoji: editingEmoji
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
          <button
            type="button"
            onClick={() => setIsNewEmojiModalOpen(true)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-2xl transition-colors hover:bg-slate-100"
            aria-label="Elegir emoji para nueva cuenta"
          >
            {newEmoji}
          </button>
          <input
            type="text"
            placeholder="Nombre (ej: BCP, BBVA)"
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
      </form>

      <div className="space-y-2">
        {accounts.slice(0, 3).map(acc => (
          <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm text-xl">
                {getAccountEmoji(acc)}
              </div>
              <span className="text-sm font-bold text-slate-700 truncate">{acc.name}</span>
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
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm text-xl">
                  {editingAccountId === acc.id ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingEmojiModalOpen(true)}
                      className="flex h-full w-full items-center justify-center rounded-xl transition-colors hover:bg-slate-50"
                      aria-label="Cambiar emoji de cuenta"
                    >
                      {editingEmoji}
                    </button>
                  ) : (
                    getAccountEmoji(acc)
                  )}
                </div>
                {editingAccountId === acc.id ? (
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="min-w-0">
                    <div className="font-bold text-slate-700 text-sm truncate">{acc.name}</div>
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

      <EmojiPickerModal
        isOpen={isNewEmojiModalOpen}
        selectedEmoji={newEmoji}
        title="Elegir emoji"
        onClose={() => setIsNewEmojiModalOpen(false)}
        onSelect={setNewEmoji}
      />

      <EmojiPickerModal
        isOpen={isEditingEmojiModalOpen}
        selectedEmoji={editingEmoji}
        title="Cambiar emoji"
        onClose={() => setIsEditingEmojiModalOpen(false)}
        onSelect={setEditingEmoji}
      />

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
              disabled={isDeletingAccount}
              className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeletingAccount}
              className="flex-1 rounded-2xl bg-secondary-600 py-3 text-sm font-bold text-white shadow-lg shadow-secondary-100 transition-colors hover:bg-secondary-700 disabled:opacity-60"
            >
              {isDeletingAccount ? 'Eliminando...' : 'Eliminar cuenta'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
