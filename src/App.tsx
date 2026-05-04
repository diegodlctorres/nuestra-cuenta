/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  Wallet,
  TrendingDown,
  PawPrint,
  CheckSquare,
  Settings,
  ArrowRightLeft
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { ConnectivityBanner } from './components/ui/ConnectivityBanner';
import { NavButton } from './components/ui/NavButton';
import { useAuth } from './contexts/AuthContext';
import { AppNavigationProvider, useAppNavigation } from './contexts/AppNavigationContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { PetsProvider } from './contexts/PetsContext';
import { SettingsProvider, useSettingsContext } from './contexts/SettingsContext';
import { TasksProvider } from './contexts/TasksContext';

const AuthView = lazy(() => import('./views/AuthView').then(module => ({ default: module.AuthView })));
const OnboardingView = lazy(() => import('./views/OnboardingView').then(module => ({ default: module.OnboardingView })));
const DashboardView = lazy(() => import('./views/DashboardView').then(module => ({ default: module.DashboardView })));
const DetailView = lazy(() => import('./views/DetailView').then(module => ({ default: module.DetailView })));
const PetsView = lazy(() => import('./views/PetsView').then(module => ({ default: module.PetsView })));
const TasksView = lazy(() => import('./views/TasksView').then(module => ({ default: module.TasksView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(module => ({ default: module.SettingsView })));

function AppShellFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-12 text-slate-500">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <ArrowRightLeft className="h-5 w-5 animate-spin text-primary-500" />
        <span className="text-sm font-semibold">Cargando vista...</span>
      </div>
    </div>
  );
}

function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ConnectivityBanner />
      {children}
    </>
  );
}

function HouseholdShell() {
  const { activeTab, setActiveTab } = useAppNavigation();
  const { coupleSettings } = useSettingsContext();

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 font-sans pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-safe pt-safe backdrop-blur">
        <ConnectivityBanner />
        <div className="px-6 py-4">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight text-primary-600 flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6" />
              Nuestra Cuenta
            </h1>
            {(coupleSettings.partner1.photoUrl || coupleSettings.partner2.photoUrl) && (
              <div className="flex gap-2">
                {coupleSettings.partner1.photoUrl && (
                  <img src={coupleSettings.partner1.photoUrl} alt="P1" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border-2 border-primary-100" />
                )}
                {coupleSettings.partner2.photoUrl && (
                  <img src={coupleSettings.partner2.photoUrl} alt="P2" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border-2 border-secondary-100" />
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8">
        <Suspense fallback={<AppShellFallback />}>
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'detail' && <DetailView />}
            {activeTab === 'pets' && <PetsView />}
            {activeTab === 'tasks' && <TasksView />}
            {activeTab === 'settings' && <SettingsView />}
          </AnimatePresence>
        </Suspense>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-safe backdrop-blur">
        <div className="max-w-md mx-auto flex justify-between items-center px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
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
            label="Por hacer"
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


export default function App() {
  const { session, householdId, isLoading } = useAuth();
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    const updateRecoveryMode = () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const searchParams = new URLSearchParams(window.location.search);
      const recoveryType = hashParams.get('type') || searchParams.get('type');
      setIsRecoveryMode(recoveryType === 'recovery');
    };

    updateRecoveryMode();
    window.addEventListener('hashchange', updateRecoveryMode);

    return () => window.removeEventListener('hashchange', updateRecoveryMode);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
        <div className="animate-spin text-primary-500"><ArrowRightLeft className="w-8 h-8" /></div>
      </div>
    );
  }

  if (isRecoveryMode) {
    return (
      <AppFrame>
        <Suspense fallback={<AppShellFallback />}>
          <AuthView
            recoveryMode
            onRecoveryComplete={() => {
              window.history.replaceState({}, document.title, window.location.pathname);
              setIsRecoveryMode(false);
            }}
          />
        </Suspense>
      </AppFrame>
    );
  }

  if (!session) {
    return (
      <AppFrame>
        <Suspense fallback={<AppShellFallback />}>
          <AuthView />
        </Suspense>
      </AppFrame>
    );
  }

  if (!householdId) {
    return (
      <AppFrame>
        <Suspense fallback={<AppShellFallback />}>
          <OnboardingView />
        </Suspense>
      </AppFrame>
    );
  }

  return (
    <SettingsProvider>
      <FinanceProvider>
        <PetsProvider>
          <TasksProvider>
            <AppNavigationProvider>
              <HouseholdShell />
            </AppNavigationProvider>
          </TasksProvider>
        </PetsProvider>
      </FinanceProvider>
    </SettingsProvider>
  );
}
