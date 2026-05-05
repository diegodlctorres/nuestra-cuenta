import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Pet, PetTaskInput } from '../../types';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { MutationResult } from '../../lib/errors';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => new Date().toTimeString().slice(0, 5);

interface AddPetTaskFormProps {
  pets: Pet[];
  onAdd: (t: PetTaskInput) => Promise<MutationResult>;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  hideTrigger?: boolean;
}

export function AddPetTaskForm({
  pets,
  onAdd,
  isOpen: controlledIsOpen,
  onOpenChange,
  hideTrigger = false
}: AddPetTaskFormProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();
  const petError = selectedPetIds.length === 0;
  const titleError = title.trim().length === 0;
  const missingDateError = date.length === 0;
  const pastDateError = Boolean(date) && date < today;
  const pastTimeError = Boolean(date && time) && date === today && time < currentTime;
  const dateError = missingDateError || pastDateError;
  const hasErrors = petError || titleError || dateError || pastTimeError;
  const allPetsSelected = pets.length > 0 && selectedPetIds.length === pets.length;

  const inputClassName = (hasError: boolean) => cn(
    "w-full p-3 rounded-xl border text-sm transition focus:outline-none",
    hasError
      ? "border-red-300 bg-red-50 text-slate-900 focus:ring-2 focus:ring-red-200"
      : "border-transparent bg-slate-50 text-slate-900 focus:ring-2 focus:ring-secondary-500"
  );

  const setIsOpen = (nextIsOpen: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(nextIsOpen);
    }

    onOpenChange?.(nextIsOpen);
  };

  const togglePet = (id: string) => {
    setSelectedPetIds(prev => {
      if (prev.length === pets.length) {
        return [id];
      }

      const nextSelectedPetIds = prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id];

      return nextSelectedPetIds.length === pets.length
        ? pets.map(p => p.id)
        : nextSelectedPetIds;
    });
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setNotes('');
    setSelectedPetIds([]);
    setSubmitAttempted(false);
    setSaveError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setSaveError('');

    const submitToday = getTodayDateString();
    const submitCurrentTime = getCurrentTimeString();
    const submitDateError = date.length === 0 || date < submitToday;
    const submitTimeError = Boolean(date && time) && date === submitToday && time < submitCurrentTime;

    if (petError || titleError || submitDateError || submitTimeError || isSaving) return;

    setIsSaving(true);
    const result = await onAdd({
      petIds: selectedPetIds,
      title: title.trim(),
      scheduled_date: date,
      scheduled_time: time || undefined,
      notes: notes || undefined
    });
    setIsSaving(false);

    if (result.ok) {
      resetForm();
      setIsOpen(false);
    } else {
      setSaveError(result.message);
    }
  };

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom,0px))] right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-500 text-white shadow-2xl shadow-secondary-200 transition-colors hover:bg-secondary-600 active:scale-95"
          aria-label="Nueva tarea de mascota"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <Modal isOpen={isOpen} onClose={() => { if (!isSaving) { setIsOpen(false); setSubmitAttempted(false); setSaveError(''); } }} title="Nueva Tarea Mascota">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && petError ? "text-red-500" : "text-slate-400")}>Seleccionar Mascota(s)</label>
            <div className="flex flex-wrap gap-2">
              {pets.map(p => (
                <button
                  key={p.id} type="button" onClick={() => togglePet(p.id)} disabled={isSaving}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                    selectedPetIds.includes(p.id) && !allPetsSelected ? "bg-secondary-500 text-white border-secondary-500" : "bg-white text-slate-500 border-slate-200",
                    submitAttempted && petError && "border-red-300 bg-red-50 text-red-600"
                  )}
                >
                  {p.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedPetIds(pets.map(p => p.id))}
                disabled={isSaving}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                  allPetsSelected ? "bg-secondary-500 text-white border-secondary-500" : "bg-white text-primary-600 border-slate-200",
                  submitAttempted && petError && "border-red-300 bg-red-50 text-red-600"
                )}
              >
                Todos
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
              disabled={isSaving}
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
                min={today}
                onChange={e => setDate(e.target.value)}
                disabled={isSaving}
                aria-invalid={submitAttempted && dateError}
              />
              {submitAttempted && missingDateError && (
                <p className="text-xs text-red-500 ml-1">La fecha es obligatoria.</p>
              )}
              {submitAttempted && pastDateError && (
                <p className="text-xs text-red-500 ml-1">La fecha debe ser hoy o posterior.</p>
              )}
            </div>
            <div className="space-y-1">
              <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && pastTimeError ? "text-red-500" : "text-slate-400")}>Hora</label>
              <input
                type="time"
                className={inputClassName(submitAttempted && pastTimeError)}
                value={time}
                min={date === today ? currentTime : undefined}
                onChange={e => setTime(e.target.value)}
                disabled={isSaving}
                aria-invalid={submitAttempted && pastTimeError}
              />
              {submitAttempted && pastTimeError && (
                <p className="text-xs text-red-500 ml-1">La hora no puede estar en el pasado.</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Notas</label>
            <textarea placeholder="Notas adicionales..." className={cn(inputClassName(false), "min-h-[80px]")} value={notes} onChange={e => setNotes(e.target.value)} disabled={isSaving} />
          </div>
          {saveError && (
            <p className="text-xs text-red-500 ml-1">{saveError}</p>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-secondary-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-secondary-100 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : 'Programar Tarea'}
          </button>
        </form>
      </Modal>
    </>
  );
}
