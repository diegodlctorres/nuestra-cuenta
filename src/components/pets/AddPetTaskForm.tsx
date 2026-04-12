import React, { useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { Pet } from '../../types';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

export function AddPetTaskForm({ pets, onAdd }: { pets: Pet[], onAdd: (t: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const togglePet = (id: string) => {
    setSelectedPetIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || selectedPetIds.length === 0) return;
    onAdd({
      petIds: selectedPetIds,
      title,
      scheduledDate: date,
      scheduledTime: time || undefined,
      notes: notes || undefined
    });
    setTitle(''); setDate(''); setTime(''); setNotes(''); setSelectedPetIds([]);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-6 bg-white rounded-3xl border border-slate-200 flex justify-between items-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-xl"><Plus className="w-6 h-6 text-rose-500" /></div>
          Nueva Tarea Mascota
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nueva Tarea Mascota">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Seleccionar Mascota(s)</label>
            <div className="flex flex-wrap gap-2">
              {pets.map(p => (
                <button
                  key={p.id} type="button" onClick={() => togglePet(p.id)}
                  className={cn("px-3 py-2 rounded-xl text-xs font-bold border transition-all", selectedPetIds.includes(p.id) ? "bg-rose-500 text-white border-rose-500" : "bg-white text-slate-500 border-slate-200")}
                >
                  {p.name}
                </button>
              ))}
              <button type="button" onClick={() => setSelectedPetIds(pets.map(p => p.id))} className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-indigo-600">
                Ambos/Todos
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">¿Qué necesita?</label>
            <input type="text" placeholder="Vacuna, Baño, etc." className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha</label>
              <input type="date" required className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hora</label>
              <input type="time" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Notas</label>
            <textarea placeholder="Notas adicionales..." className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500 min-h-[80px]" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-100 mt-4">Programar Tarea</button>
        </form>
      </Modal>
    </>
  );
}
