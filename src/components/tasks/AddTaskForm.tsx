import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { TaskMutationResult } from '../../hooks/useTasks';
import { RecurrenceEndType, RecurrenceUnit, TaskInput } from '../../types';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => new Date().toTimeString().slice(0, 5);

const createDefaultTaskInput = (): TaskInput => ({
  title: '',
  deadline: '',
  due_time: '',
  requires_transaction: false,
  is_recurring: false,
  recurrence_unit: 'month',
  recurrence_interval: 1,
  recurrence_end_type: 'never',
  recurrence_until: null,
  series_anchor_date: ''
});

const recurrenceUnitOptions: Array<{ value: RecurrenceUnit; label: string }> = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' }
];

const recurrenceEndTypeOptions: Array<{ value: RecurrenceEndType; label: string }> = [
  { value: 'never', label: 'Indefinido' },
  { value: 'until', label: 'Hasta fecha' }
];

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: TaskInput) => Promise<TaskMutationResult>;
  title: string;
  submitLabel: string;
  initialTask?: TaskInput;
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitLabel,
  initialTask
}: TaskFormModalProps) {
  const [formData, setFormData] = useState<TaskInput>(createDefaultTaskInput());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setFormData(initialTask
      ? {
          ...createDefaultTaskInput(),
          ...initialTask,
          due_time: initialTask.due_time || '',
          recurrence_unit: initialTask.recurrence_unit || 'month',
          recurrence_interval: initialTask.recurrence_interval || 1,
          recurrence_end_type: initialTask.recurrence_end_type || 'never',
          recurrence_until: initialTask.recurrence_until || null,
          series_anchor_date: initialTask.series_anchor_date || initialTask.deadline
        }
      : createDefaultTaskInput());
    setSubmitAttempted(false);
    setSaveError('');
  }, [initialTask, isOpen]);

  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();
  const earliestAllowedDate = initialTask?.deadline && initialTask.deadline < today
    ? initialTask.deadline
    : today;
  const titleError = formData.title.trim().length === 0;
  const missingDeadlineError = formData.deadline.length === 0;
  const pastDeadlineError = Boolean(formData.deadline) && formData.deadline < earliestAllowedDate;
  const pastTimeError = !!formData.deadline && !!formData.due_time && formData.deadline === today && formData.due_time < currentTime;
  const recurrenceIntervalError = formData.is_recurring && (!formData.recurrence_interval || formData.recurrence_interval < 1);
  const recurrenceUntilError = formData.is_recurring
    && formData.recurrence_end_type === 'until'
    && (
      !formData.recurrence_until
      || formData.recurrence_until < formData.deadline
    );
  const deadlineError = missingDeadlineError || pastDeadlineError;

  const inputClassName = (hasError: boolean) => cn(
    'w-full p-3 rounded-xl border text-sm transition focus:outline-none',
    hasError
      ? 'border-red-300 bg-red-50 text-slate-900 focus:ring-2 focus:ring-red-200'
      : 'border-transparent bg-slate-50 text-slate-900 focus:ring-2 focus:ring-primary-500'
  );

  const handleChange = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => {
    setFormData(current => {
      const next = { ...current, [key]: value };

      if (key === 'deadline' && !current.series_anchor_date) {
        next.series_anchor_date = value as string;
      }

      if (key === 'is_recurring' && !value) {
        next.recurrence_end_type = 'never';
        next.recurrence_until = null;
      }

      if (key === 'recurrence_end_type' && value === 'never') {
        next.recurrence_until = null;
      }

      return next;
    });
  };

  const incrementInterval = (delta: number) => {
    setFormData(current => ({
      ...current,
      recurrence_interval: Math.max(1, Number(current.recurrence_interval || 1) + delta)
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setSaveError('');

    const submitToday = getTodayDateString();
    const submitCurrentTime = getCurrentTimeString();
    const submitEarliestAllowedDate = initialTask?.deadline && initialTask.deadline < submitToday
      ? initialTask.deadline
      : submitToday;
    const submitDeadlineError = formData.deadline.length === 0 || formData.deadline < submitEarliestAllowedDate;
    const submitTimeError = !!formData.deadline && !!formData.due_time && formData.deadline === submitToday && formData.due_time < submitCurrentTime;
    const submitIntervalError = formData.is_recurring && (!formData.recurrence_interval || formData.recurrence_interval < 1);
    const submitRecurrenceUntilError = formData.is_recurring
      && formData.recurrence_end_type === 'until'
      && (
        !formData.recurrence_until
        || formData.recurrence_until < formData.deadline
      );

    if (titleError || submitDeadlineError || submitTimeError || submitIntervalError || submitRecurrenceUntilError || isSaving) {
      return;
    }

    setIsSaving(true);
    const result = await onSubmit({
      title: formData.title.trim(),
      deadline: formData.deadline,
      due_time: formData.due_time || undefined,
      requires_transaction: Boolean(formData.requires_transaction),
      is_recurring: formData.is_recurring,
      recurrence_unit: formData.is_recurring ? formData.recurrence_unit : null,
      recurrence_interval: formData.is_recurring ? Number(formData.recurrence_interval) : null,
      recurrence_end_type: formData.is_recurring ? formData.recurrence_end_type : null,
      recurrence_until: formData.is_recurring && formData.recurrence_end_type === 'until' ? formData.recurrence_until : null,
      series_anchor_date: formData.deadline
    });
    setIsSaving(false);

    if (result.success) {
      onClose();
    } else {
      setSaveError(result.error || 'No se pudo guardar. Inténtalo nuevamente.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title={title}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className={cn('text-[10px] font-bold uppercase ml-1', submitAttempted && titleError ? 'text-red-500' : 'text-slate-400')}>¿Qué hay que recordar?</label>
          <input
            type="text"
            placeholder="Ej: Pagar internet, Cumpleaños..."
            className={inputClassName(submitAttempted && titleError)}
            value={formData.title}
            onChange={event => handleChange('title', event.target.value)}
            disabled={isSaving}
            aria-invalid={submitAttempted && titleError}
          />
          {submitAttempted && titleError && (
            <p className="text-xs text-red-500 ml-1">El título es obligatorio.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className={cn('text-[10px] font-bold uppercase ml-1', submitAttempted && deadlineError ? 'text-red-500' : 'text-slate-400')}>Fecha</label>
            <input
              type="date"
              className={inputClassName(submitAttempted && deadlineError)}
              value={formData.deadline}
              min={earliestAllowedDate}
              onChange={event => handleChange('deadline', event.target.value)}
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
            <label className={cn('text-[10px] font-bold uppercase ml-1', submitAttempted && pastTimeError ? 'text-red-500' : 'text-slate-400')}>Hora</label>
            <input
              type="time"
              className={inputClassName(submitAttempted && pastTimeError)}
              value={formData.due_time || ''}
              min={formData.deadline === today ? currentTime : undefined}
              onChange={event => handleChange('due_time', event.target.value)}
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
            checked={Boolean(formData.requires_transaction)}
            onChange={event => handleChange('requires_transaction', event.target.checked)}
            disabled={isSaving}
          />
          <div className="text-sm font-bold text-slate-700">Requiere registrar una transacción para completar</div>
        </label>

        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            checked={formData.is_recurring}
            onChange={event => handleChange('is_recurring', event.target.checked)}
            disabled={isSaving}
          />
          <div>
            <div className="text-sm font-bold text-slate-700">Repetir recordatorio</div>
            <div className="text-xs text-slate-500 mt-1">Genera ocurrencias futuras sin crear filas infinitas.</div>
          </div>
        </label>

        {formData.is_recurring && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-[96px_1fr] gap-2 items-start">
              <div className="space-y-1">
                <label className={cn('text-[10px] font-bold uppercase ml-1', submitAttempted && recurrenceIntervalError ? 'text-red-500' : 'text-slate-400')}>Cada</label>
                <div className={cn(
                  'flex overflow-hidden rounded-xl border',
                  submitAttempted && recurrenceIntervalError
                    ? 'border-red-300 bg-red-50'
                    : 'border-transparent bg-slate-50'
                )}>
                  <div className="flex-1 px-3 py-3 text-center text-sm font-bold text-slate-900">
                    {formData.recurrence_interval || 1}
                  </div>
                  <div className="flex w-10 flex-col border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() => incrementInterval(1)}
                      className="flex flex-1 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      disabled={isSaving}
                      aria-label="Incrementar frecuencia"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => incrementInterval(-1)}
                      className="flex flex-1 items-center justify-center border-t border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      disabled={isSaving}
                      aria-label="Reducir frecuencia"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {submitAttempted && recurrenceIntervalError && (
                  <p className="text-xs text-red-500 ml-1">La frecuencia debe ser mayor a 0.</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase ml-1 text-slate-400">Periodicidad</label>
                <select
                  value={formData.recurrence_unit || 'month'}
                  onChange={event => handleChange('recurrence_unit', event.target.value as RecurrenceUnit)}
                  className={inputClassName(false)}
                  disabled={isSaving}
                >
                  {recurrenceUnitOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase ml-1 text-slate-400">Duración</label>
              <div className="grid grid-cols-2 gap-2">
                {recurrenceEndTypeOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('recurrence_end_type', option.value)}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-sm font-bold transition-colors',
                      formData.recurrence_end_type === option.value
                        ? 'border-primary-200 bg-primary-50 text-primary-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    )}
                    disabled={isSaving}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.recurrence_end_type === 'until' && (
              <div className="space-y-1">
                <label className={cn('text-[10px] font-bold uppercase ml-1', submitAttempted && recurrenceUntilError ? 'text-red-500' : 'text-slate-400')}>Repetir hasta</label>
                <input
                  type="date"
                  className={inputClassName(submitAttempted && recurrenceUntilError)}
                  value={formData.recurrence_until || ''}
                  min={formData.deadline || today}
                  onChange={event => handleChange('recurrence_until', event.target.value)}
                  disabled={isSaving}
                />
                {submitAttempted && recurrenceUntilError && (
                  <p className="text-xs text-red-500 ml-1">La fecha final debe ser igual o posterior a la fecha inicial.</p>
                )}
              </div>
            )}
          </div>
        )}

        {saveError && (
          <p className="text-xs text-red-500 ml-1">{saveError}</p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-100 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Guardando...' : submitLabel}
        </button>
      </form>
    </Modal>
  );
}

interface AddTaskFormProps {
  onAdd: (task: TaskInput) => Promise<TaskMutationResult>;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  hideTrigger?: boolean;
}

export function AddTaskForm({
  onAdd,
  isOpen: controlledIsOpen,
  onOpenChange,
  hideTrigger = false
}: AddTaskFormProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? internalIsOpen;

  const setIsOpen = (nextIsOpen: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(nextIsOpen);
    }

    onOpenChange?.(nextIsOpen);
  };

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-28 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-2xl shadow-primary-200 transition-colors hover:bg-primary-700 active:scale-95"
          aria-label="Nuevo recordatorio"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <TaskFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={onAdd}
        title="Nuevo recordatorio"
        submitLabel="Guardar recordatorio"
      />
    </>
  );
}
