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
import { DashboardView } from './views/DashboardView';
import { DetailView } from './views/DetailView';
import { PetsView } from './views/PetsView';
import { TasksView } from './views/TasksView';
import { SettingsView } from './views/SettingsView';

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
            <DashboardView
              savingsBalance={savingsBalance}
              expensesBalance={expensesBalance}
              pendingPetTasksCount={pendingPetTasksCount}
              transactions={transactions}
              coupleSettings={coupleSettings}
              categories={categories}
              addTransaction={addTransaction}
              setActiveTab={setActiveTab}
              setDetailSubTab={setDetailSubTab}
            />
          )}
          {activeTab === 'detail' && (
            <DetailView
              detailSubTab={detailSubTab}
              setDetailSubTab={setDetailSubTab}
              transactions={transactions}
              groupedTransactions={groupedTransactions}
              coupleSettings={coupleSettings}
            />
          )}
          {activeTab === 'pets' && (
            <PetsView
              pets={pets}
              petTasks={petTasks}
              setPetTasks={setPetTasks}
              addPetTask={addPetTask}
              completePetTask={completePetTask}
            />
          )}
          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              addTask={addTask}
              toggleTask={toggleTask}
              downloadICS={downloadICS}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsView
              coupleSettings={coupleSettings}
              setCoupleSettings={setCoupleSettings}
              pets={pets}
              updatePet={updatePet}
              deletePet={deletePet}
              addPet={addPet}
              categories={categories}
              setCategories={setCategories}
            />
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




