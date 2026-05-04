import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { queryKeys } from '../lib/queryKeys';

export function usePets() {
  const { householdId, memberId } = useAuth();
  const queryClient = useQueryClient();

  const petsQuery = useQuery({
    queryKey: queryKeys.pets(householdId),
    queryFn: () => loadPetsSnapshot(householdId!),
    enabled: Boolean(householdId)
  });

  const pets = petsQuery.data?.pets || [];
  const petTasks = petsQuery.data?.petTasks || [];
  const isLoading = petsQuery.isLoading;

  const pendingPetTasksCount = useMemo(() =>
    petTasks.filter(t => !t.completed).length
  , [petTasks]);

  const invalidatePets = useCallback(() => (
    queryClient.invalidateQueries({ queryKey: queryKeys.pets(householdId) })
  ), [householdId, queryClient]);

  const addPetMutation = useMutation({
    mutationFn: (pet: Omit<Pet, 'id' | 'household_id'>) => createPet(householdId!, pet),
    onSuccess: invalidatePets
  });

  const addPet = async (pet: Omit<Pet, 'id' | 'household_id'>) => {
    if (!householdId) return false;
    try {
      await addPetMutation.mutateAsync(pet);
      return true;
    } catch (error) {
      console.error('Error adding pet:', error);
      return false;
    }
  };

  const updatePetMutation = useMutation({
    mutationFn: (pet: Pet) => editPet(householdId!, pet),
    onSuccess: invalidatePets
  });

  const updatePet = async (updatedPet: Pet) => {
    if (!householdId) return;
    try {
      await updatePetMutation.mutateAsync(updatedPet);
    } catch (error) {
      console.error('Error updating pet:', error);
    }
  };

  const deletePetMutation = useMutation({
    mutationFn: (petId: string) => removePet(householdId!, petId),
    onSuccess: invalidatePets
  });

  const deletePet = async (id: string) => {
    if (!householdId) return false;
    
    try {
      await deletePetMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error('Error deleting pet:', error);
      return false;
    }
  };

  const addPetTaskMutation = useMutation({
    mutationFn: (task: PetTaskInput) => createPetTasks(task, pets),
    onSuccess: invalidatePets
  });

  const addPetTask = async (task: PetTaskInput) => {
    try {
      const tasks = await addPetTaskMutation.mutateAsync(task);
      if (tasks.length === 0) return false;
      return true;
    } catch (error) {
      console.error('Error adding pet tasks:', error);
      return false;
    }
  };

  const completePetTaskMutation = useMutation({
    mutationFn: ({ id, memberId, householdId }: { id: string; memberId: string; householdId: string }) =>
      completePetTaskRecord(id, memberId, householdId),
    onSuccess: invalidatePets
  });

  const completePetTask = async (id: string) => {
    if (!memberId || !householdId) return false;
    try {
      await completePetTaskMutation.mutateAsync({ id, memberId, householdId });
      return true;
    } catch (error) {
      console.error('Error completing pet task:', error);
      return false;
    }
  };

  const reopenPetTaskMutation = useMutation({
    mutationFn: reopenPetTaskRecord,
    onSuccess: invalidatePets
  });

  const reopenPetTask = async (id: string) => {
    try {
      await reopenPetTaskMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error('Error reopening pet task:', error);
      return false;
    }
  };

  const deletePetTaskMutation = useMutation({
    mutationFn: removePetTask,
    onSuccess: invalidatePets
  });

  const deletePetTask = async (id: string) => {
    try {
      await deletePetTaskMutation.mutateAsync(id);
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
