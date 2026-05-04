import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Task } from '../../types';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { TaskMutationResult } from '../../hooks/useTasks';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => new Date().toTimeString().slice(0, 5);

export function AddTaskForm({ onAdd }: { onAdd: (t: Omit<Task, 'id' | 'household_id' | 'completed'>) => Promise<TaskMutationResult> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [requiresTransaction, setRequiresTransaction] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();
  const titleError = title.trim().length === 0;
  const missingDeadlineError = deadline.length === 0;
  const pastDeadlineError = Boolean(deadline) && deadline < today;
  const pastTimeError = Boolean(deadline && dueTime) && deadline === today && dueTime < currentTime;
  const deadlineError = missingDeadlineError || pastDeadlineError;

  const inputClassName = (hasError: boolean) => cn(
    "w-full p-3 rounded-xl border text-sm transition focus:outline-none",
    hasError
      ? "border-red-300 bg-red-50 text-slate-900 focus:ring-2 focus:ring-red-200"
      : "border-transparent bg-slate-50 text-slate-900 focus:ring-2 focus:ring-primary-500"
  );

  const resetForm = () => {
    setTitle('');
    setDeadline('');
    setDueTime('');
    setRequiresTransaction(false);
    setSubmitAttempted(false);
    setSaveError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setSaveError('');

    const submitToday = getTodayDateString();
    const submitCurrentTime = getCurrentTimeString();
    const submitDeadlineError = deadline.length === 0 || deadline < submitToday;
    const submitTimeError = Boolean(deadline && dueTime) && deadline === submitToday && dueTime < submitCurrentTime;

    if (titleError || submitDeadlineError || submitTimeError || isSaving) return;

    setIsSaving(true);
    const result = await onAdd({
      title: title.trim(),
      deadline,
      due_time: dueTime || undefined,
      requires_transaction: requiresTransaction
    });
    setIsSaving(false);

    if (result.success) {
      resetForm();
      setIsOpen(false);
    } else {
      setSaveError(result.error || 'No se pudo guardar. Inténtalo nuevamente.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-2xl shadow-primary-200 transition-colors hover:bg-primary-700 active:scale-95"
        aria-label="Nuevo por hacer"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Modal isOpen={isOpen} onClose={() => { if (!isSaving) { setIsOpen(false); setSubmitAttempted(false); setSaveError(''); } }} title="Nuevo por hacer">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && titleError ? "text-red-500" : "text-slate-400")}>¿Qué hay que recordar?</label>
            <input
              type="text"
              placeholder="Ej: Pagar internet, Cumpleaños..."
              className={inputClassName(submitAttempted && titleError)}
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isSaving}
              aria-invalid={submitAttempted && titleError}
            />
            {submitAttempted && titleError && (
              <p className="text-xs text-red-500 ml-1">El título es obligatorio.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && deadlineError ? "text-red-500" : "text-slate-400")}>Fecha Límite</label>
              <input
                type="date"
                className={inputClassName(submitAttempted && deadlineError)}
                value={deadline}
                min={today}
                onChange={e => setDeadline(e.target.value)}
                disabled={isSaving}
                aria-invalid={submitAttempted && deadlineError}
              />
              {submitAttempted && missingDeadlineError && (
                <p className="text-xs text-red-500 ml-1">La fecha es obligatoria.</p>
              )}
              {submitAttempted && pastDeadlineError && (
                <p className="text-xs text-red-500 ml-1">La fecha debe ser hoy o posterior.</p>
              )}
            </div>
            <div className="space-y-1">
              <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && pastTimeError ? "text-red-500" : "text-slate-400")}>Hora</label>
              <input
                type="time"
                className={inputClassName(submitAttempted && pastTimeError)}
                value={dueTime}
                min={deadline === today ? currentTime : undefined}
                onChange={e => setDueTime(e.target.value)}
                disabled={isSaving}
                aria-invalid={submitAttempted && pastTimeError}
              />
              {submitAttempted && pastTimeError && (
                <p className="text-xs text-red-500 ml-1">La hora no puede estar en el pasado.</p>
              )}
            </div>
          </div>
          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              checked={requiresTransaction}
              onChange={e => setRequiresTransaction(e.target.checked)}
              disabled={isSaving}
            />
            <div className="text-sm font-bold text-slate-700">Requiere registrar una transacción para completar</div>
          </label>
          {saveError && (
            <p className="text-xs text-red-500 ml-1">{saveError}</p>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-100 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : 'Guardar por hacer'}
          </button>
        </form>
      </Modal>
    </>
  );
}
