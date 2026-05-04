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
    onSuccess: (updatedPet) => {
      updatePetsSnapshot((snapshot) => ({
        ...snapshot,
        pets: snapshot.pets
          .map((pet) => pet.id === updatedPet.id ? updatedPet : pet)
          .sort((a, b) => a.name.localeCompare(b.name))
      }));
    }
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
