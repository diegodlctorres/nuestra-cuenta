import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Category, AccountType } from '../../types';
import { Modal } from '../ui/Modal';

export function CategoryManager({ title, type, categories, onAdd, onDelete }: {
  title: string,
  type: AccountType,
  categories: Category[],
  onAdd: (name: string) => void,
  onDelete: (id: string) => void
}) {
  const [newName, setNewName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayCategories = categories.slice(0, 3);
  const hasMore = categories.length > 3;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">{title}</h3>
        {hasMore && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider"
          >
            Ver más ({categories.length})
          </button>
        )}
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nueva categoría"
          className="flex-1 p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button
          onClick={() => {
            if (newName) {
              onAdd(newName);
              setNewName('');
            }
          }}
          className="p-3 bg-indigo-600 text-white rounded-xl"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {displayCategories.map(c => (
          <div key={c.id} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <span className="text-sm font-medium text-slate-600">{c.name}</span>
            <button onClick={() => onDelete(c.id)} className="text-slate-400 hover:text-rose-500">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={title}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nueva categoría"
              className="flex-1 p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button
              onClick={() => {
                if (newName) {
                  onAdd(newName);
                  setNewName('');
                }
              }}
              className="p-3 bg-indigo-600 text-white rounded-xl"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <div key={c.id} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                <span className="text-sm font-medium text-slate-600">{c.name}</span>
                <button onClick={() => onDelete(c.id)} className="text-slate-400 hover:text-rose-500">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
