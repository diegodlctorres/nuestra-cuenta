import { useState, useEffect, useMemo } from 'react';
import { Pet, PetTask } from '../types';

export function usePets() {
  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('nc_pets');
    return saved ? JSON.parse(saved) : [];
  });

  const [petTasks, setPetTasks] = useState<PetTask[]>(() => {
    const saved = localStorage.getItem('nc_pet_tasks');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      const migrated: PetTask[] = [];
      parsed.forEach((t: any) => {
        if (Array.isArray(t.petIds)) {
          t.petIds.forEach((pid: string) => {
            migrated.push({
              ...t,
              id: `${t.id}-${pid}`,
              petId: pid,
              petIds: undefined
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
    localStorage.setItem('nc_pets', JSON.stringify(pets));
  }, [pets]);

  useEffect(() => {
    localStorage.setItem('nc_pet_tasks', JSON.stringify(petTasks));
  }, [petTasks]);

  const pendingPetTasksCount = useMemo(() =>
    petTasks.filter(t => !t.completed).length
    , [petTasks]);

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

  return { pets, petTasks, setPetTasks, pendingPetTasksCount, addPet, updatePet, deletePet, addPetTask, completePetTask };
}
