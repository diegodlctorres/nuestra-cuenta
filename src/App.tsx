/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wallet,
  TrendingDown,
  PawPrint,
  CheckSquare,
  Settings,
  ArrowRightLeft
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { NavButton } from './components/ui/NavButton';
import { DashboardView } from './views/DashboardView';
import { DetailView } from './views/DetailView';
import { PetsView } from './views/PetsView';
import { TasksView } from './views/TasksView';
import { SettingsView } from './views/SettingsView';
import { useSettings } from './hooks/useSettings';
import { useTransactions } from './hooks/useTransactions';
import { usePets } from './hooks/usePets';
import { useTasks } from './hooks/useTasks';


export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'detail' | 'pets' | 'tasks' | 'settings'>('dashboard');
  const [detailSubTab, setDetailSubTab] = useState<'expenses' | 'savings'>('expenses');


  const { coupleSettings, setCoupleSettings, categories, setCategories } = useSettings();
  const { transactions, savingsBalance, expensesBalance, groupedTransactions, addTransaction } = useTransactions();
  const { pets, petTasks, setPetTasks, pendingPetTasksCount, addPet, updatePet, deletePet, addPetTask, completePetTask } = usePets();
  const { tasks, addTask, toggleTask, downloadICS } = useTasks();



  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-primary-600 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6" />
            Nuestra Cuenta
          </h1>
          <div className="flex gap-2">
            {coupleSettings.partner1.photoUrl ? (
              <img src={coupleSettings.partner1.photoUrl} alt="P1" className="w-8 h-8 rounded-full object-cover border-2 border-primary-100" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs uppercase">
                {(coupleSettings.partner1.nickname || coupleSettings.partner1.name || 'P').charAt(0)}
              </div>
            )}
            {coupleSettings.partner2.photoUrl ? (
              <img src={coupleSettings.partner2.photoUrl} alt="P2" className="w-8 h-8 rounded-full object-cover border-2 border-secondary-100" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-bold text-xs uppercase">
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