import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, PawPrint, Trash2, Palette } from 'lucide-react';
import { CoupleSettingsModal } from '../components/settings/CoupleSettingsModal';
import { CategoryManager } from '../components/settings/CategoryManager';
import { AccountManager } from '../components/settings/AccountManager';
import { EditPetModal } from '../components/pets/EditPetModal';
import { AddPetForm } from '../components/pets/AddPetForm';
import { InvitePartnerModal } from '../components/settings/InvitePartnerModal';
import { useAuth } from '../contexts/AuthContext';
import { CoupleSettings, Pet, Category } from '../types';

interface SettingsViewProps {
  coupleSettings: CoupleSettings;
  setCoupleSettings: (s: CoupleSettings) => void;
  pets: Pet[];
  updatePet: (pet: Pet, file?: File) => void;
  deletePet: (id: string) => void;
  addPet: (pet: Omit<Pet, 'id' | 'household_id'>, file?: File) => void;
  categories: Category[];
  addCategory: (name: string, kind: 'income' | 'expense') => void;
  deleteCategory: (id: string) => void;
  accounts: Account[];
  addAccount: (name: string, type: AccountType) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
}

export function SettingsView({
  coupleSettings,
  setCoupleSettings,
  pets,
  updatePet,
  deletePet,
  addPet,
  addCategory,
  deleteCategory,
  accounts,
  addAccount,
  updateAccount,
  deleteAccount
}: SettingsViewProps) {
  const THEMES = [
    { id: 'default', name: 'Original', color1: '#6366f1', color2: '#f43f5e' },
    { id: 'oceanic', name: 'Oceánico', color1: '#14b8a6', color2: '#f97316' },
    { id: 'nature', name: 'Naturaleza', color1: '#10b981', color2: '#f59e0b' },
    { id: 'sunset', name: 'Atardecer', color1: '#c026d3', color2: '#f97316' },
  ] as const;

  const { signOut, householdId } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
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
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary-500" />
              Tema Visual
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map(theme => {
              const isActive = (coupleSettings.theme || 'default') === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setCoupleSettings({ ...coupleSettings, theme: theme.id as any })}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isActive 
                      ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm z-10" style={{ backgroundColor: theme.color1 }} />
                    <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.color2 }} />
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-primary-700' : 'text-slate-600'}`}>
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

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
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                        <PawPrint className="w-5 h-5 text-secondary-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{pet.name}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{pet.species}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <EditPetModal pet={pet} onUpdate={updatePet} />
                    <button onClick={() => deletePet(pet.id)} className="p-2 text-slate-400 hover:text-secondary-500 transition-colors rounded-lg hover:bg-secondary-50 border border-transparent">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <AddPetForm onAdd={addPet} />
        </div>

        <AccountManager 
          accounts={accounts} 
          onAdd={addAccount} 
          onDelete={deleteAccount} 
          onUpdate={updateAccount} 
        />

        <CategoryManager
          title="Categorías de Gastos"
          type="checking"
          categories={categories.filter(c => c.kind === 'expense')}
          onAdd={(name) => addCategory(name, 'expense')}
          onDelete={deleteCategory}
        />

        <CategoryManager
          title="Categorías de Ingresos / Ahorros"
          type="savings"
          categories={categories.filter(c => c.kind === 'income')}
          onAdd={(name) => addCategory(name, 'income')}
          onDelete={deleteCategory}
        />

        {/* Sección de Cuenta y Peligro */}
        <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-rose-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-rose-500" />
              Cuenta y Acceso
            </h3>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => setIsInviteOpen(true)}
              className="w-full flex items-center justify-center p-3 rounded-xl border-2 border-primary-100 bg-primary-50 text-primary-700 font-bold hover:bg-primary-100 transition-colors"
            >
              Invitar a mi Pareja
            </button>
            <button 
              onClick={signOut}
              className="w-full flex items-center justify-center p-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

      </div>
      
      <InvitePartnerModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </motion.div>
  );
}
