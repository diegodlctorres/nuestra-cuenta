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

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'detail' | 'pets' | 'tasks' | 'settings'>('dashboard');
  const [detailSubTab, setDetailSubTab] = useState<'expenses' | 'savings'>('expenses');
  
  const [coupleSettings, setCoupleSettings] = useState<CoupleSettings>(() => {
    const saved = localStorage.getItem('nc_couple_settings');
    return saved ? JSON.parse(saved) : { partner1: 'Ariana', partner2: 'Luis' };
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
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">A</div>
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">L</div>
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

              <AddTransactionForm onAdd={addTransaction} categories={categories} coupleSettings={coupleSettings} />
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
                      {task.isDebt && (
                        <div className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase">
                          Deuda
                        </div>
                      )}
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

function TransactionGroup({ title, icon, transactions, coupleSettings }: { title: string, icon: React.ReactNode, transactions: Transaction[], coupleSettings: CoupleSettings }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  if (transactions.length === 0) return null;

  const displayTransactions = transactions.slice(0, 3);
  const hasMore = transactions.length > 3;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
        </div>
        {hasMore && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider"
          >
            Ver más ({transactions.length})
          </button>
        )}
      </div>
      <div className="space-y-3">
        {displayTransactions.map(t => (
          <TransactionItem key={t.id} t={t} coupleSettings={coupleSettings} />
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={title}>
        <div className="space-y-3">
          {transactions.map(t => (
            <TransactionItem key={t.id} t={t} coupleSettings={coupleSettings} />
          ))}
        </div>
      </Modal>
    </div>
  );
}

function TransactionItem({ t, coupleSettings, showRecurrence = true }: { t: Transaction, coupleSettings: CoupleSettings, showRecurrence?: boolean, key?: string }) {
  const isIncome = t.type === 'income';
  
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-xl",
          isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
        <div>
          <div className="font-medium text-sm flex items-center gap-2">
            {t.description}
            {showRecurrence && !isIncome && t.recurrence && (
              <span className={cn(
                "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                t.recurrence === 'fixed' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              )}>
                {t.recurrence === 'fixed' ? 'Fijo' : 'Variable'}
              </span>
            )}
            {isIncome && t.createdBy && (
              <span className={cn(
                "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                t.createdBy === coupleSettings.partner1 ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-700"
              )}>
                {t.createdBy}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            {format(parseISO(t.date), showRecurrence ? 'dd MMMM yyyy' : 'dd MMM', { locale: es })} {showRecurrence && `• ${t.category}`} • {t.account === 'savings' ? 'Ahorros' : 'Gastos'}
          </div>
        </div>
      </div>
      <div className={cn("font-bold", isIncome ? "text-emerald-600" : "text-rose-600")}>
        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
      </div>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Plus className="w-6 h-6 text-slate-400 rotate-45" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function MonthlyBalanceButton({ transactions, account }: { transactions: Transaction[], account: AccountType }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const filteredTransactions = transactions.filter(t => {
    const date = parseISO(t.date);
    return t.account === account && 
           date.getMonth() === selectedMonth && 
           date.getFullYear() === selectedYear;
  });

  const totalIncomes = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenseCategoryTotals = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const sortedCategories = Object.entries(expenseCategoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
        title="Balance Mensual"
      >
        <Calendar className="w-5 h-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Balance ${account === 'savings' ? 'Ahorros' : 'Gastos'}`}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mes</label>
              <select 
                className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Año</label>
              <select 
                className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-3xl p-4 border border-emerald-100 text-center">
              <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-1">Ingresos</div>
              <div className="text-lg font-bold text-emerald-700">{formatCurrency(totalIncomes)}</div>
            </div>
            <div className="bg-rose-50 rounded-3xl p-4 border border-rose-100 text-center">
              <div className="text-rose-600 text-[10px] font-bold uppercase tracking-wider mb-1">Egresos</div>
              <div className="text-lg font-bold text-rose-700">{formatCurrency(totalExpenses)}</div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white text-center">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Balance Neto</div>
            <div className={cn(
              "text-3xl font-bold",
              (totalIncomes - totalExpenses) >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {formatCurrency(totalIncomes - totalExpenses)}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Egresos por Categoría</h4>
            {sortedCategories.length > 0 ? (
              <div className="space-y-2">
                {sortedCategories.map(([category, amount]) => (
                  <div key={category} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{category}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0}% del total
                      </span>
                    </div>
                    <span className="font-bold text-rose-600">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm italic">
                No hay egresos en este periodo
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-indigo-600" : "text-slate-400"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-colors",
        active ? "bg-indigo-50" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function AddTransactionForm({ onAdd, categories, coupleSettings }: { onAdd: (t: Omit<Transaction, 'id'>) => void, categories: Category[], coupleSettings: CoupleSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [account, setAccount] = useState<AccountType>('expenses');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('variable');
  const [createdBy, setCreatedBy] = useState<string>(coupleSettings.partner1);

  const filteredCategories = categories.filter(c => c.type === account);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.name === category)) {
      setCategory(filteredCategories[0].name);
    }
  }, [account, filteredCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onAdd({
      amount: Math.abs(parseFloat(amount)),
      description,
      account,
      type,
      category: category || 'General',
      recurrence: type === 'expense' ? recurrence : undefined,
      createdBy: type === 'income' ? createdBy : undefined,
      date: new Date().toISOString(),
    });
    setAmount('');
    setDescription('');
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full p-6 bg-white rounded-3xl border border-slate-200 flex justify-between items-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Plus className="w-6 h-6 text-indigo-600" />
          </div>
          Nueva Transacción
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nueva Transacción">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cuenta</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setAccount('expenses')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-all",
                  account === 'expenses' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"
                )}
              >
                Gastos
              </button>
              <button 
                type="button"
                onClick={() => setAccount('savings')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-all",
                  account === 'savings' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200"
                )}
              >
                Ahorros
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Movimiento</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setType('income')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-all",
                  type === 'income' ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-500 border-slate-200"
                )}
              >
                Ingreso
              </button>
              <button 
                type="button"
                onClick={() => setType('expense')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-all",
                  type === 'expense' ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-500 border-slate-200"
                )}
              >
                Egreso
              </button>
            </div>
          </div>

          {type === 'income' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">¿Quién lo hizo?</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setCreatedBy(coupleSettings.partner1)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold border transition-all truncate px-2",
                    createdBy === coupleSettings.partner1 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  {coupleSettings.partner1}
                </button>
                <button 
                  type="button"
                  onClick={() => setCreatedBy(coupleSettings.partner2)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold border transition-all truncate px-2",
                    createdBy === coupleSettings.partner2 ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  {coupleSettings.partner2}
                </button>
              </div>
            </div>
          )}

          {type === 'expense' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Periodicidad</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setRecurrence('variable')}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold border transition-all",
                    recurrence === 'variable' ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  Variable
                </button>
                <button 
                  type="button"
                  onClick={() => setRecurrence('fixed')}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold border transition-all",
                    recurrence === 'fixed' ? "bg-amber-600 text-white border-amber-600" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  Fijo
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Monto</label>
            <input 
              type="number" 
              placeholder="Monto (ej: -50 o 100)" 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
            <input 
              type="text" 
              placeholder="¿En qué se usó?" 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría</label>
            <select 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {filteredCategories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 mt-4">
            Guardar Transacción
          </button>
        </form>
      </Modal>
    </>
  );
}

function CategoryManager({ title, type, categories, onAdd, onDelete }: { 
  title: string, 
  type: AccountType, 
  categories: Category[], 
  onAdd: (name: string) => void, 
  onDelete: (id: string) => void 
}) {
  const [newName, setNewName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayCategories = categories.slice(0, 3);
  const hasMore = categories.length > 3;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">{title}</h3>
        {hasMore && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider"
          >
            Ver más ({categories.length})
          </button>
        )}
      </div>
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          placeholder="Nueva categoría" 
          className="flex-1 p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button 
          onClick={() => {
            if (newName) {
              onAdd(newName);
              setNewName('');
            }
          }}
          className="p-3 bg-indigo-600 text-white rounded-xl"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {displayCategories.map(c => (
          <div key={c.id} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <span className="text-sm font-medium text-slate-600">{c.name}</span>
            <button onClick={() => onDelete(c.id)} className="text-slate-400 hover:text-rose-500">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={title}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nueva categoría" 
              className="flex-1 p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button 
              onClick={() => {
                if (newName) {
                  onAdd(newName);
                  setNewName('');
                }
              }}
              className="p-3 bg-indigo-600 text-white rounded-xl"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <div key={c.id} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                <span className="text-sm font-medium text-slate-600">{c.name}</span>
                <button onClick={() => onDelete(c.id)} className="text-slate-400 hover:text-rose-500">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CoupleSettingsModal({ coupleSettings, setCoupleSettings }: { coupleSettings: CoupleSettings, setCoupleSettings: (s: CoupleSettings) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full p-6 bg-white rounded-3xl border border-slate-200 flex justify-between items-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <UserPlus className="w-6 h-6 text-indigo-600" />
          </div>
          Nombres de la Pareja
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nombres de la Pareja">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mujer</label>
            <input 
              type="text" 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={coupleSettings.partner1}
              onChange={e => setCoupleSettings({ ...coupleSettings, partner1: e.target.value })}
              placeholder="Nombre de ella"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hombre</label>
            <input 
              type="text" 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={coupleSettings.partner2}
              onChange={e => setCoupleSettings({ ...coupleSettings, partner2: e.target.value })}
              placeholder="Nombre de él"
            />
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 mt-4"
          >
            Guardar Cambios
          </button>
        </div>
      </Modal>
    </>
  );
}

function EditPetModal({ pet, onUpdate }: { pet: Pet, onUpdate: (pet: Pet) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(pet.name);
  const [species, setSpecies] = useState(pet.species);
  const [breed, setBreed] = useState(pet.breed || '');
  const [birthDate, setBirthDate] = useState(pet.birthDate || '');
  const [photoUrl, setPhotoUrl] = useState(pet.photoUrl || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setPhotoUrl(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onUpdate({ ...pet, name, species, breed, birthDate: birthDate || undefined, photoUrl: photoUrl || undefined });
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors rounded-lg hover:bg-slate-100 border border-transparent">
        <Pencil className="w-4 h-4" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Editar Mascota">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
            <input type="text" placeholder="Nombre" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Especie</label>
            <select className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500" value={species} onChange={e => setSpecies(e.target.value)}>
              <option>Perro</option>
              <option>Gato</option>
              <option>Otro</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Raza</label>
            <input type="text" placeholder="Raza (opcional)" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500" value={breed} onChange={e => setBreed(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cumpleaños</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Foto (Opcional)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center justify-center w-full p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors text-sm text-slate-500">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {photoUrl ? "Cambiar foto" : "Subir archivo de imagen"}
              </label>
              {photoUrl && <img src={photoUrl} alt="Vista previa" className="w-12 h-12 object-cover rounded-full shadow-sm flex-shrink-0" />}
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 mt-4">Guardar Cambios</button>
        </form>
      </Modal>
    </>
  );
}

function AddPetForm({ onAdd }: { onAdd: (pet: Omit<Pet, 'id'>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Perro');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setPhotoUrl(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({ name, species, breed, birthDate: birthDate || undefined, photoUrl: photoUrl || undefined });
    setName('');
    setBreed('');
    setBirthDate('');
    setPhotoUrl('');
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full p-4 flex justify-between items-center font-bold text-slate-700 hover:bg-slate-50 transition-colors rounded-2xl"
      >
        <span className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-rose-500" />
          Registrar Mascota
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Registrar Mascota">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
            <input 
              type="text" 
              placeholder="Nombre de la mascota" 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Especie</label>
            <select 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500"
              value={species}
              onChange={e => setSpecies(e.target.value)}
            >
              <option>Perro</option>
              <option>Gato</option>
              <option>Otro</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Raza</label>
            <input 
              type="text" 
              placeholder="Raza (opcional)" 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500"
              value={breed}
              onChange={e => setBreed(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cumpleaños</label>
            <input 
              type="date" 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Foto (Opcional)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center justify-center w-full p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors text-sm text-slate-500">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {photoUrl ? "Cambiar foto" : "Subir archivo de imagen"}
              </label>
              {photoUrl && (
                <img src={photoUrl} alt="Vista previa" className="w-12 h-12 object-cover rounded-full shadow-sm flex-shrink-0" />
              )}
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-100 mt-4">
            Registrar Mascota
          </button>
        </form>
      </Modal>
    </>
  );
}

function AddPetTaskForm({ pets, onAdd }: { pets: Pet[], onAdd: (t: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const togglePet = (id: string) => {
    setSelectedPetIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
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
    setTitle('');
    setDate('');
    setTime('');
    setNotes('');
    setSelectedPetIds([]);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full p-6 bg-white rounded-3xl border border-slate-200 flex justify-between items-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-xl">
            <Plus className="w-6 h-6 text-rose-500" />
          </div>
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
                  key={p.id}
                  type="button"
                  onClick={() => togglePet(p.id)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                    selectedPetIds.includes(p.id) ? "bg-rose-500 text-white border-rose-500" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  {p.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedPetIds(pets.map(p => p.id))}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-indigo-600"
              >
                Ambos/Todos
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">¿Qué necesita?</label>
            <input 
              type="text" 
              placeholder="Vacuna, Baño, etc." 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha</label>
              <input 
                type="date" 
                required
                className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hora</label>
              <input 
                type="time" 
                className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Notas</label>
            <textarea 
              placeholder="Notas adicionales..." 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500 min-h-[80px]"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-100 mt-4">
            Programar Tarea
          </button>
        </form>
      </Modal>
    </>
  );
}

function AddTaskForm({ onAdd }: { onAdd: (t: Omit<Task, 'id' | 'completed'>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isDebt, setIsDebt] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;
    onAdd({
      title,
      deadline,
      isDebt
    });
    setTitle('');
    setDeadline('');
    setIsDebt(false);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full p-6 bg-white rounded-3xl border border-slate-200 flex justify-between items-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Plus className="w-6 h-6 text-indigo-600" />
          </div>
          Nuevo Recordatorio
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nuevo Recordatorio">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">¿Qué hay que recordar?</label>
            <input 
              type="text" 
              placeholder="Ej: Pagar internet, Cumpleaños..." 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Límite</label>
            <input 
              type="date" 
              className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-indigo-500"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              checked={isDebt}
              onChange={e => setIsDebt(e.target.checked)}
            />
            <span className="text-sm text-slate-600 font-medium">Es una deuda pendiente</span>
          </label>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 mt-4">
            Crear Recordatorio
          </button>
        </form>
      </Modal>
    </>
  );
}
