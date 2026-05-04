import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Calendar, CalendarPlus } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { AddTaskForm } from '../components/tasks/AddTaskForm';
import { TransactionModal } from '../components/transactions/AddTransactionForm';
import { Task } from '../types';
import { Transaction, Category, Account } from '../types';
import { TaskMutationResult } from '../hooks/useTasks';

interface TasksViewProps {
  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'household_id' | 'completed'>) => Promise<TaskMutationResult>;
  toggleTask: (id: string) => Promise<boolean>;
  downloadICS: (task: Task) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'household_id' | 'created_by'>) => Promise<boolean>;
  categories: Category[];
  accounts: Account[];
}

export function TasksView({
  tasks,
  addTask,
  toggleTask,
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
      <h2 className="text-2xl font-bold">Por hacer</h2>

      <AddTaskForm onAdd={addTask} />

      <div className="space-y-3">
        {tasks.sort((a, b) => Number(a.completed) - Number(b.completed)).map(task => {
          const isOverdue = !task.completed && isAfter(new Date(), parseISO(task.deadline));
          return (
            <div
              key={task.id}
              className={cn(
                "bg-white p-4 rounded-2xl border transition-all flex items-center gap-4",
                task.completed ? "opacity-60 border-slate-100" : "border-slate-200 shadow-sm",
                isOverdue && !task.completed ? "border-secondary-200 bg-secondary-50/30" : ""
              )}
            >
              <button
                onClick={() => handleToggleTask(task)}
                className={cn(
                  "transition-colors",
                  task.completed ? "text-primary-600" : "text-slate-300 hover:text-primary-400"
                )}
              >
                {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>
              <div className="flex-1">
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
              <div className="flex items-center gap-2">
                {task.requires_transaction && (
                  <div className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase">
                    Transacción
                  </div>
                )}
                {!task.completed && (
                  <button
                    onClick={() => downloadICS(task)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-slate-100"
                    title="Añadir al Calendario"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
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
