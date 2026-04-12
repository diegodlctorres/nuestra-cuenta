import React from 'react';
import { motion } from 'framer-motion';
import { Settings, PawPrint, Trash2 } from 'lucide-react';
import { CoupleSettingsModal } from '../components/settings/CoupleSettingsModal';
import { CategoryManager } from '../components/settings/CategoryManager';
import { EditPetModal } from '../components/pets/EditPetModal';
import { AddPetForm } from '../components/pets/AddPetForm';
import { CoupleSettings, Pet, Category } from '../types';

interface SettingsViewProps {
  coupleSettings: CoupleSettings;
  setCoupleSettings: (s: CoupleSettings) => void;
  pets: Pet[];
  updatePet: (pet: Pet) => void;
  deletePet: (id: string) => void;
  addPet: (pet: Omit<Pet, 'id'>) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
}

export function SettingsView({
  coupleSettings,
  setCoupleSettings,
  pets,
  updatePet,
  deletePet,
  addPet,
  categories,
  setCategories
}: SettingsViewProps) {
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
  );
}
