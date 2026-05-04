import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Calendar, CalendarPlus, Trash2 } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { AddTaskForm } from '../components/tasks/AddTaskForm';
import { TransactionModal } from '../components/transactions/AddTransactionForm';
import { Modal } from '../components/ui/Modal';
import { Task } from '../types';
import { Transaction, Category, Account } from '../types';
import { TaskMutationResult } from '../hooks/useTasks';

interface TasksViewProps {
  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'household_id' | 'completed'>) => Promise<TaskMutationResult>;
  toggleTask: (id: string) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  downloadICS: (task: Task) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => Promise<boolean>;
  categories: Category[];
  accounts: Account[];
}

function TaskItem({
  task,
  onToggle,
  onDelete,
  onDownloadICS
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => Promise<boolean>;
  onDownloadICS: () => void;
}) {
  const isOverdue = !task.completed && isAfter(new Date(), parseISO(task.deadline));
  const [offsetX, setOffsetX] = useState(0);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [isDesktopDeleteVisible, setIsDesktopDeleteVisible] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const startXRef = useRef<number | null>(null);
  const dragStartOffsetRef = useRef(0);
  const pointerTypeRef = useRef<string | null>(null);
  const SWIPE_ACTION_WIDTH = 96;
  const SWIPE_THRESHOLD = 48;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerTypeRef.current = event.pointerType;
    if (event.pointerType === 'mouse') return;
    startXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetX;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || pointerTypeRef.current === 'mouse') return;
    const deltaX = event.clientX - startXRef.current;
    const nextOffset = Math.max(-SWIPE_ACTION_WIDTH, Math.min(0, dragStartOffsetRef.current + deltaX));
    setOffsetX(nextOffset);
  };

  const handlePointerEnd = () => {
    if (pointerTypeRef.current === 'mouse') {
      pointerTypeRef.current = null;
      return;
    }
    if (startXRef.current === null) return;
    const shouldOpen = offsetX <= -SWIPE_THRESHOLD;
    setOffsetX(shouldOpen ? -SWIPE_ACTION_WIDTH : 0);
    setIsSwipeOpen(shouldOpen);
    startXRef.current = null;
    pointerTypeRef.current = null;
  };

  const closeSwipe = () => {
    setOffsetX(0);
    setIsSwipeOpen(false);
  };

  const handleDelete = async () => {
    const wasDeleted = await onDelete();
    if (wasDeleted) {
      closeSwipe();
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button
          type="button"
          onClick={() => setIsDeleteConfirmOpen(true)}
          className="w-24 bg-secondary-600 text-white text-xs font-bold uppercase tracking-wider"
        >
          Eliminar
        </button>
      </div>

      <div
        className={cn(
          "bg-white p-4 rounded-2xl border transition-all flex items-center gap-4 shadow-sm group",
          task.completed ? "opacity-60 border-slate-100" : "border-slate-200",
          isOverdue && !task.completed ? "border-secondary-200 bg-secondary-50/30" : "",
          "touch-pan-y"
        )}
        style={{ transform: `translateX(${offsetX}px)`, touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onMouseEnter={() => setIsDesktopDeleteVisible(true)}
        onMouseLeave={() => setIsDesktopDeleteVisible(false)}
        onClick={() => {
          if (isSwipeOpen) closeSwipe();
        }}
      >
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          className={cn(
            "transition-colors shrink-0",
            task.completed ? "text-primary-600" : "text-slate-300 hover:text-primary-400"
          )}
        >
          {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-sm",
            task.completed && "line-through text-slate-400"
          )}>
            {task.title}
          </div>
          <div className={cn(
            "text-xs flex items-center gap-1 mt-1",
            isOverdue && !task.completed && "text-secondary-600 font-medium",
            !isOverdue || task.completed ? "text-slate-400" : ""
          )}>
            <Calendar className="w-3 h-3" />
            {format(parseISO(task.deadline), 'dd MMM yyyy', { locale: es })}
            {task.due_time && ` • ${task.due_time.slice(0, 5)}`}
            {isOverdue && !task.completed && " (Vencido)"}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.requires_transaction && (
            <div className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase">
              Transacción
            </div>
          )}
          {!task.completed && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDownloadICS();
              }}
              className="p-2 bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-slate-100"
              title="Añadir al Calendario"
            >
              <CalendarPlus className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsDeleteConfirmOpen(true);
            }}
            className={cn(
              "rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition-all",
              isDesktopDeleteVisible ? "opacity-100 pointer-events-auto hover:border-secondary-200 hover:bg-secondary-50 hover:text-secondary-600" : "opacity-0 pointer-events-none"
            )}
            aria-label="Eliminar recordatorio"
            title="Eliminar recordatorio"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Confirmar eliminación"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-secondary-100 bg-secondary-50 p-4">
            <p className="text-sm font-semibold text-secondary-700">
              Vas a eliminar este recordatorio.
            </p>
            <p className="mt-2 text-sm text-secondary-600">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-800">{task.title}</div>
            <div className="mt-2 text-xs text-slate-500">
              {format(parseISO(task.deadline), 'dd MMM yyyy', { locale: es })}
              {task.due_time && ` • ${task.due_time.slice(0, 5)}`}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-2xl bg-secondary-600 py-3 text-sm font-bold text-white shadow-lg shadow-secondary-100 transition-colors hover:bg-secondary-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function TasksView({
  tasks,
  addTask,
  toggleTask,
  deleteTask,
  downloadICS,
  addTransaction,
  categories,
  accounts
}: TasksViewProps) {
  const [transactionTask, setTransactionTask] = React.useState<Task | null>(null);

  const handleToggleTask = (task: Task) => {
    if (!task.completed && task.requires_transaction) {
      setTransactionTask(task);
      return;
    }

    toggleTask(task.id);
  };

  const handleTransactionForTask = async (transaction: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => {
    if (!transactionTask) return false;

    const transactionSaved = await addTransaction(transaction);
    if (!transactionSaved) return false;

    const taskCompleted = await toggleTask(transactionTask.id);
    if (taskCompleted) {
      setTransactionTask(null);
    }

    return taskCompleted;
  };

  return (
    <motion.div
      key="tasks"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold">Recordatorios</h2>

      <AddTaskForm onAdd={addTask} />

      <div className="space-y-3">
        {tasks.sort((a, b) => Number(a.completed) - Number(b.completed)).map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={() => handleToggleTask(task)}
            onDelete={() => deleteTask(task.id)}
            onDownloadICS={() => downloadICS(task)}
          />
        ))}
      </div>

      <TransactionModal
        isOpen={!!transactionTask}
        onClose={() => setTransactionTask(null)}
        onAdd={handleTransactionForTask}
        categories={categories}
        accounts={accounts}
        initialDescription={transactionTask ? transactionTask.title : ''}
        title="Registrar transacción pendiente"
      />
    </motion.div>
  );
}
