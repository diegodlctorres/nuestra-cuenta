import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Pet, PetTask, PetTaskInput } from '../types';
import {
  completePetTaskRecord,
  createPet,
  createPetTasks,
  editPet,
  loadPetsSnapshot,
  removePet,
  removePetTask,
  reopenPetTaskRecord
} from '../lib/petsData';

export function usePets() {
  const { householdId, memberId } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petTasks, setPetTasks] = useState<PetTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      const snapshot = await loadPetsSnapshot(householdId);
      setPets(snapshot.pets);
      setPetTasks(snapshot.petTasks);
    } catch (error) {
      console.error('Error loading pet data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingPetTasksCount = useMemo(() =>
    petTasks.filter(t => !t.completed).length
  , [petTasks]);

  const addPet = async (pet: Omit<Pet, 'id' | 'household_id'>) => {
    if (!householdId) return false;
    try {
      const newPet = await createPet(householdId, pet);
      setPets(currentPets => [...currentPets, newPet]);
      return true;
    } catch (error) {
      console.error('Error adding pet:', error);
      return false;
    }
  };

  const updatePet = async (updatedPet: Pet) => {
    if (!householdId) return;
    try {
      const pet = await editPet(householdId, updatedPet);
      setPets(currentPets => currentPets.map(currentPet => currentPet.id === updatedPet.id ? pet : currentPet));
    } catch (error) {
      console.error('Error updating pet:', error);
    }
  };

  const deletePet = async (id: string) => {
    if (!householdId) return false;
    
    try {
      await removePet(householdId, id);
      setPets(currentPets => currentPets.filter(p => p.id !== id));
      setPetTasks(currentPetTasks => currentPetTasks.filter(pt => pt.pet_id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting pet:', error);
      return false;
    }
  };

  const addPetTask = async (task: PetTaskInput) => {
    try {
      const tasks = await createPetTasks(task, pets);
      if (tasks.length === 0) return false;
      setPetTasks(currentPetTasks => [...tasks, ...currentPetTasks]);
      return true;
    } catch (error) {
      console.error('Error adding pet tasks:', error);
      return false;
    }
  };

  const completePetTask = async (id: string) => {
    if (!memberId || !householdId) return false;
    try {
      const { completedDate, completedByMember } = await completePetTaskRecord(id, memberId, householdId);

      setPetTasks(currentPetTasks => currentPetTasks.map(t =>
        t.id === id
          ? {
              ...t,
              completed: true,
              completed_date: completedDate,
              completed_by: memberId,
              completedByMember
            }
          : t
      ));
      return true;
    } catch (error) {
      console.error('Error completing pet task:', error);
      return false;
    }
  };

  const reopenPetTask = async (id: string) => {
    try {
      await reopenPetTaskRecord(id);
      setPetTasks(currentPetTasks => currentPetTasks.map(t =>
        t.id === id
          ? { ...t, completed: false, completed_date: undefined, completed_by: undefined, completedByMember: undefined }
          : t
      ));
      return true;
    } catch (error) {
      console.error('Error reopening pet task:', error);
      return false;
    }
  };

  const deletePetTask = async (id: string) => {
    try {
      await removePetTask(id);
      setPetTasks(currentPetTasks => currentPetTasks.filter(task => task.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting pet task:', error);
      return false;
    }
  };

  return { 
    pets, 
    petTasks, 
    pendingPetTasksCount, 
    addPet, 
    updatePet, 
    deletePet, 
    addPetTask, 
    completePetTask,
    reopenPetTask,
    deletePetTask,
    isLoading 
  };
}
