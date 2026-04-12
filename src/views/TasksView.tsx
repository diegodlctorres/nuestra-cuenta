import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Calendar, CalendarPlus } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { AddTaskForm } from '../components/tasks/AddTaskForm';
import { Task } from '../types';

interface TasksViewProps {
  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'completed'>) => void;
  toggleTask: (id: string) => void;
  downloadICS: (task: Task) => void;
}

export function TasksView({
  tasks,
  addTask,
  toggleTask,
  downloadICS
}: TasksViewProps) {
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
        {tasks.sort((a, b) => Number(a.completed) - Number(b.completed)).map(task => {
          const isOverdue = !task.completed && isAfter(new Date(), parseISO(task.deadline));
          return (
            <div
              key={task.id}
              className={cn(
                "bg-white p-4 rounded-2xl border transition-all flex items-center gap-4",
                task.completed ? "opacity-60 border-slate-100" : "border-slate-200 shadow-sm",
                isOverdue && !task.completed ? "border-rose-200 bg-rose-50/30" : ""
              )}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={cn(
                  "transition-colors",
                  task.completed ? "text-indigo-600" : "text-slate-300 hover:text-indigo-400"
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
                  isOverdue && !task.completed && "text-rose-600 font-medium",
                  !isOverdue || task.completed ? "text-slate-400" : ""
                )}>
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(task.deadline), 'dd MMM yyyy', { locale: es })}
                  {isOverdue && !task.completed && " (Vencido)"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {task.isDebt && (
                  <div className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase">
                    Deuda
                  </div>
                )}
                {!task.completed && (
                  <button
                    onClick={() => downloadICS(task)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-100"
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
    </motion.div>
  );
}
