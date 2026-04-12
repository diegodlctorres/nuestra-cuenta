import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PawPrint, Clock, Calendar, History, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AddPetTaskForm } from '../components/pets/AddPetTaskForm';
import { Pet, PetTask } from '../types';

interface PetsViewProps {
  pets: Pet[];
  petTasks: PetTask[];
  setPetTasks: (tasks: PetTask[]) => void;
  addPetTask: (task: any) => void;
  completePetTask: (id: string) => void;
}

export function PetsView({
  pets,
  petTasks,
  setPetTasks,
  addPetTask,
  completePetTask,
}: PetsViewProps) {
  const [selectedTask, setSelectedTask] = useState<PetTask | null>(null);
  const [historyPet, setHistoryPet] = useState<Pet | null>(null);

  return (
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
  );
}
