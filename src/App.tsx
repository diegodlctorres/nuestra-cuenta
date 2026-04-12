/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  PiggyBank,
  PawPrint,
  CheckSquare,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarPlus,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronRight,
  ArrowRightLeft,
  Clock,
  History,
  Info,
  UserPlus,
  Settings,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isAfter, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatCurrency } from './lib/utils';
import { Transaction, Task, Pet, PetTask, AccountType, Category, RecurrenceType, CoupleSettings, TransactionType } from './types';
import { Modal } from './components/ui/Modal';
import { NavButton } from './components/ui/NavButton';
import { TransactionItem } from './components/transactions/TransactionItem';
import { TransactionGroup } from './components/transactions/TransactionGroup';
import { MonthlyBalanceButton } from './components/transactions/MonthlyBalanceButton';
import { AddTransactionForm } from './components/transactions/AddTransactionForm';
import { CoupleSettingsModal } from './components/settings/CoupleSettingsModal';
import { CategoryManager } from './components/settings/CategoryManager';
import { EditPetModal } from './components/pets/EditPetModal';
import { AddPetForm } from './components/pets/AddPetForm';
import { AddPetTaskForm } from './components/pets/AddPetTaskForm';
import { AddTaskForm } from './components/tasks/AddTaskForm';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'detail' | 'pets' | 'tasks' | 'settings'>('dashboard');
  const [detailSubTab, setDetailSubTab] = useState<'expenses' | 'savings'>('expenses');

  const [coupleSettings, setCoupleSettings] = useState<CoupleSettings>(() => {
    const saved = localStorage.getItem('nc_couple_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.partner1 === 'string') {
        return {
          partner1: { name: parsed.partner1 },
          partner2: { name: parsed.partner2 }
        };
      }
      return parsed;
    }
    return {
      partner1: { name: 'Ariana' },
      partner2: { name: 'Luis' }
    };
  });

  useEffect(() => {
    localStorage.setItem('nc_couple_settings', JSON.stringify(coupleSettings));
  }, [coupleSettings]);

  // State with LocalStorage persistence
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('nc_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('nc_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('nc_pets');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('nc_categories');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'General', type: 'expenses' },
      { id: '2', name: 'Comida', type: 'expenses' },
      { id: '3', name: 'Salidas', type: 'expenses' },
      { id: '4', name: 'Viajes', type: 'expenses' },
      { id: '5', name: 'Mascotas', type: 'expenses' },
      { id: '6', name: 'Sueldo/Ingreso', type: 'savings' },
      { id: '7', name: 'Inversión', type: 'savings' },
    ];
  });

  const [petTasks, setPetTasks] = useState<PetTask[]>(() => {
    const saved = localStorage.getItem('nc_pet_tasks');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Migration: Convert old petIds array to individual tasks if needed
      // This is a bit tricky since we are changing the schema back.
      // If we find a task with petIds, we split it.
      const migrated: PetTask[] = [];
      parsed.forEach((t: any) => {
        if (Array.isArray(t.petIds)) {
          t.petIds.forEach((pid: string) => {
            migrated.push({
              ...t,
              id: `${t.id}-${pid}`, // Ensure unique ID
              petId: pid,
              petIds: undefined // Remove old field
            } as any);
          });
        } else if (t.petId) {
          migrated.push(t);
        }
      });
      return migrated;
    } catch (e) {
      console.error("Error parsing pet tasks", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nc_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('nc_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('nc_pets', JSON.stringify(pets));
  }, [pets]);

  useEffect(() => {
    localStorage.setItem('nc_pet_tasks', JSON.stringify(petTasks));
  }, [petTasks]);

  useEffect(() => {
    localStorage.setItem('nc_categories', JSON.stringify(categories));
  }, [categories]);

  // Calculations
  const savingsBalance = useMemo(() =>
    transactions.filter(t => t.account === 'savings').reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0)
    , [transactions]);

  const expensesBalance = useMemo(() =>
    transactions.filter(t => t.account === 'expenses').reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0)
    , [transactions]);

  const groupedTransactions = useMemo(() => {
    const filterByAccount = (acc: AccountType) => transactions.filter(t => t.account === acc);

    return {
      expenses: {
        incomes: filterByAccount('expenses').filter(t => t.type === 'income'),
        fixed: filterByAccount('expenses').filter(t => t.type === 'expense' && t.recurrence === 'fixed'),
        variable: filterByAccount('expenses').filter(t => t.type === 'expense' && (t.recurrence === 'variable' || !t.recurrence)),
      },
      savings: {
        incomes: filterByAccount('savings').filter(t => t.type === 'income'),
        fixed: filterByAccount('savings').filter(t => t.type === 'expense' && t.recurrence === 'fixed'),
        variable: filterByAccount('savings').filter(t => t.type === 'expense' && (t.recurrence === 'variable' || !t.recurrence)),
      }
    };
  }, [transactions]);

  const pendingPetTasksCount = useMemo(() =>
    petTasks.filter(t => !t.completed).length
    , [petTasks]);

  // Handlers
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    setTransactions([newTransaction, ...transactions]);
  };

  const addTask = (task: Omit<Task, 'id' | 'completed'>) => {
    const newTask = { ...task, id: crypto.randomUUID(), completed: false };
    setTasks([newTask, ...tasks]);
  };

  const downloadICS = (task: Task) => {
    const dateIso = task.deadline.replace(/-/g, '');
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nuestra Cuenta//Recordatorios//ES',
      'BEGIN:VEVENT',
      `UID:${task.id}@nuestracuenta.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${dateIso}`,
      `DTEND;VALUE=DATE:${dateIso}`,
      `SUMMARY:${task.title}`,
      `DESCRIPTION:Recordatorio de Nuestra Cuenta\\nGenerado de forma automática.`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${task.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addPet = (pet: Omit<Pet, 'id'>) => {
    const newPet = { ...pet, id: crypto.randomUUID() };
    setPets([...pets, newPet]);
  };

  const updatePet = (updatedPet: Pet) => {
    setPets(pets.map(p => p.id === updatedPet.id ? updatedPet : p));
  };

  const deletePet = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta mascota? Sus tareas asociadas también se eliminarán.")) {
      setPets(pets.filter(p => p.id !== id));
      setPetTasks(petTasks.filter(pt => pt.petId !== id));
    }
  };

  const addPetTask = (task: any) => {
    const { petIds, ...taskData } = task;
    const newTasks = petIds.map((pid: string) => ({
      ...taskData,
      id: crypto.randomUUID(),
      petId: pid,
      completed: false
    }));
    setPetTasks([...newTasks, ...petTasks]);
  };

  const completePetTask = (id: string) => {
    setPetTasks(petTasks.map(t =>
      t.id === id ? { ...t, completed: true, completedDate: new Date().toISOString() } : t
    ));
  };

  const [selectedTask, setSelectedTask] = useState<PetTask | null>(null);
  const [historyPet, setHistoryPet] = useState<Pet | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-indigo-600 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6" />
            Nuestra Cuenta
          </h1>
          <div className="flex gap-2">
            {coupleSettings.partner1.photoUrl ? (
              <img src={coupleSettings.partner1.photoUrl} alt="P1" className="w-8 h-8 rounded-full object-cover border-2 border-indigo-100" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                {(coupleSettings.partner1.nickname || coupleSettings.partner1.name || 'P').charAt(0)}
              </div>
            )}
            {coupleSettings.partner2.photoUrl ? (
              <img src={coupleSettings.partner2.photoUrl} alt="P2" className="w-8 h-8 rounded-full object-cover border-2 border-rose-100" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs uppercase">
                {(coupleSettings.partner2.nickname || coupleSettings.partner2.name || 'P').charAt(0)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <AddTransactionForm onAdd={addTransaction} categories={categories} coupleSettings={coupleSettings} />

              {/* Account Cards */}
              <div className="grid grid-cols-1 gap-4">
                <div
                  onClick={() => {
                    setActiveTab('detail');
                    setDetailSubTab('savings');
                  }}
                  className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <PiggyBank className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Ahorros / Futuro</span>
                  </div>
                  <div className="text-3xl font-bold mb-1">{formatCurrency(savingsBalance)}</div>
                  <div className="text-indigo-100 text-sm">Uso recreativo y metas</div>
                </div>

                <div
                  onClick={() => {
                    setActiveTab('detail');
                    setDetailSubTab('expenses');
                  }}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-100 rounded-xl">
                      <Wallet className="w-6 h-6 text-slate-600" />
                    </div>
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Gastos</span>
                  </div>
                  <div className="text-3xl font-bold mb-1 text-slate-900">{formatCurrency(expensesBalance)}</div>
                  <div className="text-slate-500 text-sm">Fijos, viajes y salidas</div>
                </div>
              </div>

              <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-500 rounded-xl">
                    <PawPrint className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-rose-900">Mascotas</h3>
                    <p className="text-xs text-rose-700">Tareas pendientes</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-900">{pendingPetTasksCount} tareas</div>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Actividad Reciente</h3>
                  <button onClick={() => setActiveTab('detail')} className="text-indigo-600 text-sm font-medium">Ver todo</button>
                </div>
                <div className="space-y-3">
                  {transactions.slice(0, 3).map(t => (
                    <TransactionItem key={t.id} t={t} coupleSettings={coupleSettings} showRecurrence={false} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'detail' && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-900 rounded-2xl">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Detalle</h2>
                </div>
                <MonthlyBalanceButton transactions={transactions} account={detailSubTab} />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setDetailSubTab('expenses')}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                    detailSubTab === 'expenses' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  )}
                >
                  Gastos
                </button>
                <button
                  onClick={() => setDetailSubTab('savings')}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                    detailSubTab === 'savings' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  )}
                >
                  Ahorros
                </button>
              </div>

              <div className="space-y-8">
                {detailSubTab === 'expenses' ? (
                  <>
                    <TransactionGroup
                      title="Ingresos"
                      icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                      transactions={groupedTransactions.expenses.incomes}
                      coupleSettings={coupleSettings}
                    />
                    <TransactionGroup
                      title="Gastos Fijos"
                      icon={<Clock className="w-4 h-4 text-amber-500" />}
                      transactions={groupedTransactions.expenses.fixed}
                      coupleSettings={coupleSettings}
                    />
                    <TransactionGroup
                      title="Gastos Variables"
                      icon={<TrendingDown className="w-4 h-4 text-blue-500" />}
                      transactions={groupedTransactions.expenses.variable}
                      coupleSettings={coupleSettings}
                    />

                    {groupedTransactions.expenses.incomes.length === 0 && groupedTransactions.expenses.fixed.length === 0 && groupedTransactions.expenses.variable.length === 0 && (
                      <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <div className="text-slate-400 text-sm">No hay movimientos registrados</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <TransactionGroup
                      title="Ingresos"
                      icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                      transactions={groupedTransactions.savings.incomes}
                      coupleSettings={coupleSettings}
                    />
                    <TransactionGroup
                      title="Ahorros Fijos"
                      icon={<Clock className="w-4 h-4 text-indigo-500" />}
                      transactions={groupedTransactions.savings.fixed}
                      coupleSettings={coupleSettings}
                    />
                    <TransactionGroup
                      title="Ahorros Variables"
                      icon={<TrendingDown className="w-4 h-4 text-blue-500" />}
                      transactions={groupedTransactions.savings.variable}
                      coupleSettings={coupleSettings}
                    />

                    {groupedTransactions.savings.incomes.length === 0 && groupedTransactions.savings.fixed.length === 0 && groupedTransactions.savings.variable.length === 0 && (
                      <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <div className="text-slate-400 text-sm">No hay movimientos registrados</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'pets' && (
            <motion.div
              key="pets"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500 rounded-2xl">
                  <PawPrint className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Mascotas</h2>
              </div>

              {pets.length > 0 && (
                <AddPetTaskForm pets={pets} onAdd={addPetTask} />
              )}

              <div className="space-y-8">
                {pets.map(pet => {
                  const tasksForPet = petTasks.filter(t => t.petId === pet.id && !t.completed);
                  const historyForPet = petTasks.filter(t => t.petId === pet.id && t.completed);
                  const displayHistory = historyForPet
                    .sort((a, b) => b.completedDate!.localeCompare(a.completedDate!))
                    .slice(0, 3);

                  return (
                    <div key={pet.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
                            {pet.photoUrl ? (
                              <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <PawPrint className="w-6 h-6 text-rose-500" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">{pet.name}</h3>
                            <p className="text-xs text-slate-500">
                              {pet.species} {pet.breed ? `• ${pet.breed}` : ''}
                              {pet.birthDate && ` • 🎂 ${format(parseISO(pet.birthDate), 'dd MMM', { locale: es })}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Pending Tasks */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Pendientes
                          </h4>
                          <div className="space-y-2">
                            {tasksForPet.map(task => (
                              <div key={task.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                                <button
                                  onClick={() => setSelectedTask(task)}
                                  className="flex-1 text-left"
                                >
                                  <div className="text-sm font-bold text-slate-700">{task.title}</div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(parseISO(task.scheduledDate), 'dd MMM yyyy', { locale: es })}
                                    {task.scheduledTime && ` • ${task.scheduledTime}`}
                                  </div>
                                </button>
                                <button
                                  onClick={() => completePetTask(task.id)}
                                  className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm ml-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            {tasksForPet.length === 0 && (
                              <p className="text-xs text-slate-400 italic">No hay tareas pendientes</p>
                            )}
                          </div>
                        </div>

                        {/* History */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                              <History className="w-3 h-3" /> Historial
                            </h4>
                            {historyForPet.length > 3 && (
                              <button
                                onClick={() => setHistoryPet(pet)}
                                className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider"
                              >
                                Ver todo
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {displayHistory.map(task => (
                              <button
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className="w-full bg-white border border-slate-100 p-3 rounded-xl flex justify-between items-center opacity-75 text-left"
                              >
                                <div>
                                  <div className="text-sm font-medium text-slate-600">{task.title}</div>
                                  <div className="text-[10px] text-slate-400">
                                    Realizado el {format(parseISO(task.completedDate!), 'dd MMM yyyy', { locale: es })}
                                  </div>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              </button>
                            ))}
                            {historyForPet.length === 0 && (
                              <p className="text-xs text-slate-400 italic">Sin historial aún</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Task Detail Modal */}
              <AnimatePresence>
                {selectedTask && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedTask(null)}
                      className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-rose-50 rounded-2xl">
                          <PawPrint className="w-6 h-6 text-rose-500" />
                        </div>
                        <button onClick={() => {
                          setPetTasks(petTasks.filter(t => t.id !== selectedTask.id));
                          setSelectedTask(null);
                        }} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedTask.title}</h3>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>Programado: {format(parseISO(selectedTask.scheduledDate), 'dd MMMM yyyy', { locale: es })} {selectedTask.scheduledTime}</span>
                        </div>

                        {selectedTask.completed && (
                          <div className="flex items-center gap-3 text-sm text-emerald-600 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Completado el: {format(parseISO(selectedTask.completedDate!), 'dd MMMM yyyy, HH:mm', { locale: es })}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <PawPrint className="w-4 h-4 text-slate-400" />
                          <span>Mascota: {pets.find(p => p.id === selectedTask.petId)?.name || 'Sin asignar'}</span>
                        </div>

                        {selectedTask.notes && (
                          <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600">
                            <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1">Notas</div>
                            {selectedTask.notes}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedTask(null)}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm"
                      >
                        Cerrar
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Full History Modal */}
              <AnimatePresence>
                {historyPet && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setHistoryPet(null)}
                      className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                            <History className="w-5 h-5 text-rose-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">Historial Completo</h3>
                            <p className="text-xs text-slate-500">{historyPet.name}</p>
                          </div>
                        </div>
                        <button onClick={() => setHistoryPet(null)} className="p-2 text-slate-400">
                          <Plus className="w-6 h-6 rotate-45" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {petTasks
                          .filter(t => t.petId === historyPet.id && t.completed)
                          .sort((a, b) => b.completedDate!.localeCompare(a.completedDate!))
                          .map(task => (
                            <button
                              key={task.id}
                              onClick={() => {
                                setSelectedTask(task);
                                setHistoryPet(null);
                              }}
                              className="w-full bg-slate-50 p-4 rounded-2xl flex justify-between items-center text-left"
                            >
                              <div>
                                <div className="text-sm font-bold text-slate-700">{task.title}</div>
                                <div className="text-[10px] text-slate-500">
                                  Realizado el {format(parseISO(task.completedDate!), 'dd MMMM yyyy', { locale: es })}
                                </div>
                              </div>
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </button>
                          ))}
                      </div>

                      <button
                        onClick={() => setHistoryPet(null)}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm mt-6"
                      >
                        Cerrar
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
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
                          isOverdue && !task.completed ? "text-rose-600 font-medium" : "text-slate-400"
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
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-900 rounded-2xl">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Configuración</h2>
              </div>

              <div className="space-y-6">
                <CoupleSettingsModal coupleSettings={coupleSettings} setCoupleSettings={setCoupleSettings} />

                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Gestión de Mascotas</h3>
                  </div>
                  {pets.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {pets.map(pet => (
                        <div key={pet.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            {pet.photoUrl ? (
                              <img src={pet.photoUrl} alt={pet.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                                <PawPrint className="w-5 h-5 text-rose-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-700 text-sm">{pet.name}</p>
                              <p className="text-[10px] uppercase font-bold text-slate-400">{pet.species}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <EditPetModal pet={pet} onUpdate={updatePet} />
                            <button onClick={() => deletePet(pet.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 border border-transparent">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <AddPetForm onAdd={addPet} />
                </div>

                <CategoryManager
                  title="Categorías de Gastos"
                  type="expenses"
                  categories={categories.filter(c => c.type === 'expenses')}
                  onAdd={(name) => setCategories([...categories, { id: crypto.randomUUID(), name, type: 'expenses' }])}
                  onDelete={(id) => setCategories(categories.filter(c => c.id !== id))}
                />

                <CategoryManager
                  title="Categorías de Ahorros"
                  type="savings"
                  categories={categories.filter(c => c.type === 'savings')}
                  onAdd={(name) => setCategories([...categories, { id: crypto.randomUUID(), name, type: 'savings' }])}
                  onDelete={(id) => setCategories(categories.filter(c => c.id !== id))}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 pb-8 z-20">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <NavButton
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            icon={<Wallet className="w-5 h-5" />}
            label="Inicio"
          />
          <NavButton
            active={activeTab === 'detail'}
            onClick={() => setActiveTab('detail')}
            icon={<TrendingDown className="w-5 h-5" />}
            label="Detalle"
          />
          <NavButton
            active={activeTab === 'pets'}
            onClick={() => setActiveTab('pets')}
            icon={<PawPrint className="w-5 h-5" />}
            label="Mascotas"
          />
          <NavButton
            active={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
            icon={<CheckSquare className="w-5 h-5" />}
            label="Tareas"
          />
          <NavButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="w-5 h-5" />}
            label="Config"
          />
        </div>
      </nav>
    </div>
  );
}




