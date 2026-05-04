import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PawPrint, Clock, Calendar, History, CheckCircle2, Trash2, Plus, RotateCcw } from 'lucide-react';
import { differenceInMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AddPetTaskForm } from '../components/pets/AddPetTaskForm';
import { Modal } from '../components/ui/Modal';
import { Pet, PetTask, PetTaskInput } from '../types';
import { cn } from '../lib/utils';

interface PetsViewProps {
  pets: Pet[];
  petTasks: PetTask[];
  addPetTask: (task: PetTaskInput) => Promise<boolean>;
  completePetTask: (id: string) => Promise<boolean>;
  reopenPetTask: (id: string) => Promise<boolean>;
  deletePetTask: (id: string) => Promise<boolean>;
}

function formatPetAge(birthDate: string) {
  const totalMonths = Math.max(0, differenceInMonths(new Date(), parseISO(birthDate)));

  if (totalMonths < 12) {
    return `${totalMonths} ${totalMonths === 1 ? 'mes' : 'meses'}`;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (months === 0) {
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  }

  return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
}

function PendingPetTaskItem({
  task,
  onOpen,
  onComplete,
  onDelete
}: {
  task: PetTask;
  onOpen: () => void;
  onComplete: () => void;
  onDelete: () => Promise<boolean>;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [isDesktopDeleteVisible, setIsDesktopDeleteVisible] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const startXRef = useRef<number | null>(null);
  const dragStartOffsetRef = useRef(0);
  const pointerTypeRef = useRef<string | null>(null);
  const SWIPE_ACTION_WIDTH = 96;
  const SWIPE_THRESHOLD = 48;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerTypeRef.current = event.pointerType;
    if (event.pointerType === 'mouse') return;
    startXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetX;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || pointerTypeRef.current === 'mouse') return;
    const deltaX = event.clientX - startXRef.current;
    const nextOffset = Math.max(-SWIPE_ACTION_WIDTH, Math.min(0, dragStartOffsetRef.current + deltaX));
    setOffsetX(nextOffset);
  };

  const handlePointerEnd = () => {
    if (pointerTypeRef.current === 'mouse') {
      pointerTypeRef.current = null;
      return;
    }
    if (startXRef.current === null) return;
    const shouldOpen = offsetX <= -SWIPE_THRESHOLD;
    setOffsetX(shouldOpen ? -SWIPE_ACTION_WIDTH : 0);
    setIsSwipeOpen(shouldOpen);
    startXRef.current = null;
    pointerTypeRef.current = null;
  };

  const closeSwipe = () => {
    setOffsetX(0);
    setIsSwipeOpen(false);
  };

  const handleDelete = async () => {
    const wasDeleted = await onDelete();
    if (wasDeleted) {
      closeSwipe();
      setIsDeleteConfirmOpen(false);
    }
  };

  const openDeleteConfirm = () => setIsDeleteConfirmOpen(true);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button
          type="button"
          onClick={openDeleteConfirm}
          className="w-24 bg-secondary-600 text-white text-xs font-bold uppercase tracking-wider"
        >
          Eliminar
        </button>
      </div>
      <div
        className="bg-slate-50 p-3 rounded-xl flex justify-between items-center transition-transform touch-pan-y group"
        style={{ transform: `translateX(${offsetX}px)`, touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onMouseEnter={() => setIsDesktopDeleteVisible(true)}
        onMouseLeave={() => setIsDesktopDeleteVisible(false)}
        onClick={() => {
          if (isSwipeOpen) closeSwipe();
        }}
      >
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 text-left min-w-0"
        >
          <div className="text-sm font-bold text-slate-700 truncate">{task.title}</div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(parseISO(task.scheduled_date), 'dd MMM yyyy', { locale: es })}
            {task.scheduled_time && ` • ${task.scheduled_time}`}
          </div>
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm ml-2 shrink-0"
          aria-label="Completar tarea"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openDeleteConfirm();
          }}
          className={cn(
            "ml-2 shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-400 transition-all",
            isDesktopDeleteVisible ? "opacity-100 pointer-events-auto hover:border-secondary-200 hover:bg-secondary-50 hover:text-secondary-600" : "opacity-0 pointer-events-none"
          )}
          aria-label="Eliminar tarea"
          title="Eliminar tarea"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Confirmar eliminación"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-secondary-100 bg-secondary-50 p-4">
            <p className="text-sm font-semibold text-secondary-700">
              Vas a eliminar esta tarea de mascota.
            </p>
            <p className="mt-2 text-sm text-secondary-600">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-800 truncate">{task.title}</div>
            <div className="mt-2 text-xs text-slate-500">
              {format(parseISO(task.scheduled_date), 'dd/MM/yyyy')}
              {task.scheduled_time && ` • ${task.scheduled_time}`}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-2xl bg-secondary-600 py-3 text-sm font-bold text-white shadow-lg shadow-secondary-100 transition-colors hover:bg-secondary-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function PetsView({
  pets,
  petTasks,
  addPetTask,
  completePetTask,
  reopenPetTask,
  deletePetTask,
}: PetsViewProps) {
  const [selectedTask, setSelectedTask] = useState<PetTask | null>(null);
  const [historyPet, setHistoryPet] = useState<Pet | null>(null);

  const activeSelectedTask = selectedTask
    ? petTasks.find(task => task.id === selectedTask.id) || selectedTask
    : null;

  return (
    <motion.div
      key="pets"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-3 bg-secondary-500 rounded-2xl">
          <PawPrint className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Mascotas</h2>
      </div>

      {pets.length > 0 && (
        <AddPetTaskForm pets={pets} onAdd={addPetTask} />
      )}

      <div className="space-y-8">
        {pets.map(pet => {
          const tasksForPet = petTasks.filter(t => t.pet_id === pet.id && !t.completed);
          const historyForPet = petTasks.filter(t => t.pet_id === pet.id && t.completed);
          const displayHistory = [...historyForPet]
            .sort((a, b) => (b.completed_date || '').localeCompare(a.completed_date || ''))
            .slice(0, 3);

          return (
            <div key={pet.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <PawPrint className="w-6 h-6 text-secondary-500" />
                    )}
                  </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{pet.name}</h3>
                      <p className="text-xs text-slate-500">
                        {pet.birth_date
                          ? `🎂 ${format(parseISO(pet.birth_date), 'dd MMM', { locale: es })} • ${formatPetAge(pet.birth_date)}`
                          : pet.breed || ''}
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
                      <PendingPetTaskItem
                        key={task.id}
                        task={task}
                        onOpen={() => setSelectedTask(task)}
                        onComplete={() => completePetTask(task.id)}
                        onDelete={() => deletePetTask(task.id)}
                      />
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
                        className="text-[10px] font-bold text-primary-600 uppercase tracking-wider"
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
                            Realizado el {format(parseISO(task.completed_date!), 'dd MMM yyyy', { locale: es })}
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
        {activeSelectedTask && (
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
                <div className="p-3 bg-secondary-50 rounded-2xl">
                  <PawPrint className="w-6 h-6 text-secondary-500" />
                </div>
                <button onClick={() => {
                  deletePetTask(activeSelectedTask.id).then(wasDeleted => {
                    if (wasDeleted) setSelectedTask(null);
                  });
                }} className="p-2 text-slate-400 hover:text-secondary-600 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-2">{activeSelectedTask.title}</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Programado: {format(parseISO(activeSelectedTask.scheduled_date), 'dd MMMM yyyy', { locale: es })} {activeSelectedTask.scheduled_time}</span>
                </div>

                {activeSelectedTask.completed && activeSelectedTask.completed_date && (
                  <>
                    <div className="flex items-center gap-3 text-sm text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completado el: {format(parseISO(activeSelectedTask.completed_date), 'dd MMMM yyyy, HH:mm', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" />
                      <span>
                        Marcado por: {activeSelectedTask.completedByMember?.profile?.nickname || activeSelectedTask.completedByMember?.profile?.name || 'Miembro del hogar'}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <PawPrint className="w-4 h-4 text-slate-400" />
                  <span>Mascota: {pets.find(p => p.id === activeSelectedTask.pet_id)?.name || 'Sin asignar'}</span>
                </div>

                {activeSelectedTask.notes && (
                  <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1">Notas</div>
                    {activeSelectedTask.notes}
                  </div>
                )}
              </div>

              {activeSelectedTask.completed && (
                <button
                  onClick={async () => {
                    const wasReopened = await reopenPetTask(activeSelectedTask.id);
                    if (wasReopened) setSelectedTask(null);
                  }}
                  className="w-full py-3 bg-secondary-50 text-secondary-700 rounded-xl font-bold text-sm mb-3 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Revertir completado
                </button>
              )}

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
                  <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                    <History className="w-5 h-5 text-secondary-500" />
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
                  .filter(t => t.pet_id === historyPet.id && t.completed)
                  .sort((a, b) => (b.completed_date || '').localeCompare(a.completed_date || ''))
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
                          Realizado el {format(parseISO(task.completed_date!), 'dd MMMM yyyy', { locale: es })}
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
