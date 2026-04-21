import React, { useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { Pet, PetTaskInput } from '../../types';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

export function AddPetTaskForm({ pets, onAdd }: { pets: Pet[], onAdd: (t: PetTaskInput) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const petError = selectedPetIds.length === 0;
  const titleError = title.trim().length === 0;
  const dateError = date.length === 0;
  const hasErrors = petError || titleError || dateError;

  const inputClassName = (hasError: boolean) => cn(
    "w-full p-3 rounded-xl border text-sm transition focus:outline-none",
    hasError
      ? "border-red-300 bg-red-50 text-slate-900 focus:ring-2 focus:ring-red-200"
      : "border-transparent bg-slate-50 text-slate-900 focus:ring-2 focus:ring-secondary-500"
  );

  const togglePet = (id: string) => {
    setSelectedPetIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (hasErrors) return;

    onAdd({
      petIds: selectedPetIds,
      title: title.trim(),
      scheduled_date: date,
      scheduled_time: time || undefined,
      notes: notes || undefined
    });
    setTitle(''); setDate(''); setTime(''); setNotes(''); setSelectedPetIds([]); setSubmitAttempted(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-6 bg-white rounded-3xl border border-slate-200 flex justify-between items-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <div className="p-2 bg-secondary-50 rounded-xl"><Plus className="w-6 h-6 text-secondary-500" /></div>
          Nueva Tarea Mascota
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setSubmitAttempted(false); }} title="Nueva Tarea Mascota">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && petError ? "text-red-500" : "text-slate-400")}>Seleccionar Mascota(s)</label>
            <div className="flex flex-wrap gap-2">
              {pets.map(p => (
                <button
                  key={p.id} type="button" onClick={() => togglePet(p.id)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                    selectedPetIds.includes(p.id) ? "bg-secondary-500 text-white border-secondary-500" : "bg-white text-slate-500 border-slate-200",
                    submitAttempted && petError && "border-red-300 bg-red-50 text-red-600"
                  )}
                >
                  {p.name}
                </button>
              ))}
              <button type="button" onClick={() => setSelectedPetIds(pets.map(p => p.id))} className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-primary-600">
                Ambos/Todos
              </button>
            </div>
            {submitAttempted && petError && (
              <p className="text-xs text-red-500 ml-1">Selecciona al menos una mascota.</p>
            )}
          </div>
          <div className="space-y-1">
            <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && titleError ? "text-red-500" : "text-slate-400")}>¿Qué necesita?</label>
            <input
              type="text"
              placeholder="Vacuna, Baño, etc."
              className={inputClassName(submitAttempted && titleError)}
              value={title}
              onChange={e => setTitle(e.target.value)}
              aria-invalid={submitAttempted && titleError}
            />
            {submitAttempted && titleError && (
              <p className="text-xs text-red-500 ml-1">El título de la tarea es obligatorio.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && dateError ? "text-red-500" : "text-slate-400")}>Fecha</label>
              <input
                type="date"
                className={inputClassName(submitAttempted && dateError)}
                value={date}
                onChange={e => setDate(e.target.value)}
                aria-invalid={submitAttempted && dateError}
              />
              {submitAttempted && dateError && (
                <p className="text-xs text-red-500 ml-1">La fecha es obligatoria.</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hora</label>
              <input type="time" className={inputClassName(false)} value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Notas</label>
            <textarea placeholder="Notas adicionales..." className={cn(inputClassName(false), "min-h-[80px]")} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="w-full py-4 bg-secondary-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-secondary-100 mt-4">Programar Tarea</button>
        </form>
      </Modal>
    </>
  );
}
