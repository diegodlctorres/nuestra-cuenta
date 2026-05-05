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
  PetsSnapshot,
  removePet,
  removePetTask,
  reopenPetTaskRecord
} from '../lib/petsData';
import { MutationResult, mutationError, mutationMessage, mutationOk } from '../lib/errors';
import { isOffline, OFFLINE_MUTATION_MESSAGE } from '../lib/networkStatus';
import { queryKeys } from '../lib/queryKeys';

export function usePets() {
  const { householdId, memberId } = useAuth();
  const queryClient = useQueryClient();
  const petsQueryKey = queryKeys.pets(householdId);

  const petsQuery = useQuery({
    queryKey: petsQueryKey,
    queryFn: () => loadPetsSnapshot(householdId!),
    enabled: Boolean(householdId)
  });

  const pets = petsQuery.data?.pets || [];
  const petTasks = petsQuery.data?.petTasks || [];
  const isLoading = petsQuery.isLoading;

  const pendingPetTasksCount = useMemo(() =>
    petTasks.filter(t => !t.completed).length
  , [petTasks]);

  const updatePetsSnapshot = useCallback((updater: (snapshot: PetsSnapshot) => PetsSnapshot) => {
    queryClient.setQueryData<PetsSnapshot>(petsQueryKey, (current) => {
      const baseSnapshot = current || {
        pets: [],
        petTasks: []
      };

      return updater(baseSnapshot);
    });
  }, [petsQueryKey, queryClient]);

  const addPetMutation = useMutation({
    mutationFn: (pet: Omit<Pet, 'id' | 'household_id'>) => createPet(householdId!, pet),
    onSuccess: (createdPet) => {
      updatePetsSnapshot((snapshot) => ({
        ...snapshot,
        pets: [...snapshot.pets, createdPet].sort((a, b) => a.name.localeCompare(b.name))
      }));
    }
  });

  const addPet = async (pet: Omit<Pet, 'id' | 'household_id'>): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      await addPetMutation.mutateAsync(pet);
      return mutationOk();
    } catch (error) {
      console.error('Error adding pet:', error);
      return mutationError(error, 'No se pudo registrar la mascota.');
    }
  };

  const updatePetMutation = useMutation({
    mutationFn: (pet: Pet) => editPet(householdId!, pet),
    onSuccess: (updatedPet) => {
      updatePetsSnapshot((snapshot) => ({
        ...snapshot,
        pets: snapshot.pets
          .map((pet) => pet.id === updatedPet.id ? updatedPet : pet)
          .sort((a, b) => a.name.localeCompare(b.name))
      }));
    }
  });

  const updatePet = async (updatedPet: Pet): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      await updatePetMutation.mutateAsync(updatedPet);
      return mutationOk();
    } catch (error) {
      console.error('Error updating pet:', error);
      return mutationError(error, 'No se pudo actualizar la mascota.');
    }
  };

  const deletePetMutation = useMutation({
    mutationFn: (petId: string) => removePet(householdId!, petId),
    onMutate: async (petId) => {
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      const previous = queryClient.getQueryData<PetsSnapshot>(petsQueryKey);

      updatePetsSnapshot((snapshot) => ({
        pets: snapshot.pets.filter((pet) => pet.id !== petId),
        petTasks: snapshot.petTasks.filter((task) => task.pet_id !== petId)
      }));

      return { previous };
    },
    onError: (_error, _petId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(petsQueryKey, context.previous);
      }
    }
  });

  const deletePet = async (id: string): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    
    try {
      await deletePetMutation.mutateAsync(id);
      return mutationOk();
    } catch (error) {
      console.error('Error deleting pet:', error);
      return mutationError(error, 'No se pudo eliminar la mascota.');
    }
  };

  const addPetTaskMutation = useMutation({
    mutationFn: (task: PetTaskInput) => createPetTasks(task, pets),
    onSuccess: (createdTasks) => {
      updatePetsSnapshot((snapshot) => ({
        ...snapshot,
        petTasks: [...snapshot.petTasks, ...createdTasks].sort((a, b) => {
          const dateComparison = a.scheduled_date.localeCompare(b.scheduled_date);
          if (dateComparison !== 0) return dateComparison;
          return (a.scheduled_time || '').localeCompare(b.scheduled_time || '');
        })
      }));
    }
  });

  const addPetTask = async (task: PetTaskInput): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      const tasks = await addPetTaskMutation.mutateAsync(task);
      if (tasks.length === 0) return mutationMessage('Selecciona al menos una mascota válida.');
      return mutationOk();
    } catch (error) {
      console.error('Error adding pet tasks:', error);
      return mutationError(error, 'No se pudo crear la tarea de mascota.');
    }
  };

  const completePetTaskMutation = useMutation({
    mutationFn: ({ id, memberId, householdId }: { id: string; memberId: string; householdId: string }) =>
      completePetTaskRecord(id, memberId, householdId),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      const previous = queryClient.getQueryData<PetsSnapshot>(petsQueryKey);
      const optimisticCompletedDate = new Date().toISOString();

      updatePetsSnapshot((snapshot) => ({
        ...snapshot,
        petTasks: snapshot.petTasks.map((task) => task.id === id
          ? {
              ...task,
              completed: true,
              completed_date: optimisticCompletedDate
            }
          : task)
      }));

      return { previous, optimisticCompletedDate };
    },
    onSuccess: (result, variables) => {
      updatePetsSnapshot((snapshot) => ({
        ...snapshot,
        petTasks: snapshot.petTasks.map((task) => task.id === variables.id
          ? {
              ...task,
              completed: true,
              completed_date: result.completedDate,
              completed_by: variables.memberId,
              completedByMember: result.completedByMember
            }
          : task)
      }));
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(petsQueryKey, context.previous);
      }
    }
  });

  const completePetTask = async (id: string): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!memberId || !householdId) return mutationMessage('No se encontró un miembro activo del hogar.');
    try {
      await completePetTaskMutation.mutateAsync({ id, memberId, householdId });
      return mutationOk();
    } catch (error) {
      console.error('Error completing pet task:', error);
      return mutationError(error, 'No se pudo completar la tarea de mascota.');
    }
  };

  const reopenPetTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      if (!householdId) {
        throw new Error('No se puede reabrir tarea de mascota sin householdId');
      }

      return reopenPetTaskRecord(taskId, householdId);
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      const previous = queryClient.getQueryData<PetsSnapshot>(petsQueryKey);

      updatePetsSnapshot((snapshot) => ({
        ...snapshot,
        petTasks: snapshot.petTasks.map((task) => task.id === taskId
          ? {
              ...task,
              completed: false,
              completed_date: undefined,
              completed_by: undefined,
              completedByMember: undefined
            }
          : task)
      }));

      return { previous };
    },
    onError: (_error, _taskId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(petsQueryKey, context.previous);
      }
    }
  });

  const reopenPetTask = async (id: string): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      await reopenPetTaskMutation.mutateAsync(id);
      return mutationOk();
    } catch (error) {
      console.error('Error reopening pet task:', error);
      return mutationError(error, 'No se pudo reabrir la tarea de mascota.');
    }
  };

  const deletePetTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      if (!householdId) {
        throw new Error('No se puede eliminar tarea de mascota sin householdId');
      }

      return removePetTask(taskId, householdId);
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      const previous = queryClient.getQueryData<PetsSnapshot>(petsQueryKey);

      updatePetsSnapshot((snapshot) => ({
        ...snapshot,
        petTasks: snapshot.petTasks.filter((task) => task.id !== taskId)
      }));

      return { previous };
    },
    onError: (_error, _taskId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(petsQueryKey, context.previous);
      }
    }
  });

  const deletePetTask = async (id: string): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    if (!householdId) return mutationMessage('No se encontró un hogar activo.');
    try {
      await deletePetTaskMutation.mutateAsync(id);
      return mutationOk();
    } catch (error) {
      console.error('Error deleting pet task:', error);
      return mutationError(error, 'No se pudo eliminar la tarea de mascota.');
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
