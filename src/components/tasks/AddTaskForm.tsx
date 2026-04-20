import React, { useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { Task } from '../../types';
import { Modal } from '../ui/Modal';

export function AddTaskForm({ onAdd }: { onAdd: (t: Omit<Task, 'id' | 'household_id' | 'completed'>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isDebt, setIsDebt] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;
    onAdd({ title, deadline, isDebt });
    setTitle(''); setDeadline(''); setIsDebt(false); setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-6 bg-white rounded-3xl border border-slate-200 flex justify-between items-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-xl"><Plus className="w-6 h-6 text-primary-600" /></div>
          Nuevo Recordatorio
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nuevo Recordatorio">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">¿Qué hay que recordar?</label>
            <input type="text" placeholder="Ej: Pagar internet, Cumpleaños..." className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary-500" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Límite</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary-500" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={isDebt} onChange={e => setIsDebt(e.target.checked)} />
            <div>
              <div className="text-sm font-bold text-slate-700">Es una deuda</div>
              <div className="text-[10px] text-slate-500">Marcar si requiere un pago pendiente</div>
            </div>
          </label>
          <button type="submit" className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-100 mt-4">Guardar Recordatorio</button>
        </form>
      </Modal>
    </>
  );
}
