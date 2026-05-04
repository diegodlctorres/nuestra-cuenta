import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { HouseholdMember, Pet, PetTask, PetTaskInput, Profile } from '../types';

interface HouseholdMemberProfileRow {
  member_id: string;
  profile_id: string;
  name: string;
  nickname?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  avatar_url?: string | null;
}

export function usePets() {
  const { householdId, memberId } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petTasks, setPetTasks] = useState<PetTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapMemberProfile = useCallback((row: HouseholdMemberProfileRow): Profile => ({
    id: row.profile_id,
    name: row.name,
    nickname: row.nickname || undefined,
    gender: row.gender || undefined,
    birth_date: row.birth_date || undefined,
    avatar_url: row.avatar_url || undefined
  }), []);

  const loadData = useCallback(async () => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      // Load Pets
      const [{ data: petsData, error: petsError }, { data: memberProfiles, error: memberProfilesError }] = await Promise.all([
        supabase
          .from('pets')
          .select('*')
          .eq('household_id', householdId)
          .order('name'),
        supabase.rpc('get_household_member_profiles')
      ]);

      if (petsError) throw petsError;
      if (memberProfilesError) console.error('Error loading household member profiles:', memberProfilesError);

      const completedByMemberMap = new Map(
        ((memberProfiles || []) as HouseholdMemberProfileRow[]).map(row => [
          row.member_id,
          {
            id: row.member_id,
            household_id: householdId,
            profile_id: row.profile_id,
            role: 'member',
            status: 'active',
            joined_at: '',
            profile: mapMemberProfile(row)
          } as HouseholdMember
        ])
      );

      // Load Pet Tasks
      // Note: We need a complex join if we want the Pet info with the task, 
      // but here we just need the tasks for the current pets.
      const petIds = (petsData || []).map(p => p.id);
      let tasksData: PetTask[] = [];
      
      if (petIds.length > 0) {
        const { data, error: tasksError } = await supabase
          .from('pet_tasks')
          .select('*')
          .in('pet_id', petIds)
          .order('scheduled_date', { ascending: true });

        if (tasksError) throw tasksError;
        tasksData = ((data || []) as PetTask[]).map(task => ({
          ...task,
          completedByMember: task.completed_by ? completedByMemberMap.get(task.completed_by) : undefined
        }));
      }

      setPets(petsData || []);
      setPetTasks(tasksData);
    } catch (error) {
      console.error('Error loading pet data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, mapMemberProfile]);

  useEffect(() => {
    loadData();
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  const pendingPetTasksCount = useMemo(() =>
    petTasks.filter(t => !t.completed).length
  , [petTasks]);

  const addPet = async (pet: Omit<Pet, 'id' | 'household_id'>) => {
    if (!householdId) return false;
    try {
      const { data: newPet, error } = await supabase
        .from('pets')
        .insert({ ...pet, household_id: householdId })
        .select()
        .single();

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('pets')
        .update({
          name: updatedPet.name,
          species: updatedPet.species,
          breed: updatedPet.breed || null,
          birth_date: updatedPet.birth_date || null,
          photo_url: updatedPet.photo_url || null
        })
        .eq('id', updatedPet.id)
        .eq('household_id', householdId)
        .select()
        .single();

      if (error) throw error;
      setPets(currentPets => currentPets.map(p => p.id === updatedPet.id ? data : p));
    } catch (error) {
      console.error('Error updating pet:', error);
    }
  };

  const deletePet = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta mascota? Sus tareas asociadas también se eliminarán.")) return;
    
    try {
      const { error } = await supabase.from('pets').delete().eq('id', id);
      if (error) throw error;
      
      setPets(pets.filter(p => p.id !== id));
      setPetTasks(petTasks.filter(pt => pt.pet_id !== id));
    } catch (error) {
      console.error('Error deleting pet:', error);
    }
  };

  const addPetTask = async (task: PetTaskInput) => {
    const { petIds, ...taskData } = task; // Front-end format with plural petIds
    const currentPetIds = new Set(pets.map(pet => pet.id));
    const validPetIds = petIds.filter(petId => currentPetIds.has(petId));

    if (validPetIds.length === 0) return false;
    
    const dbTasks = validPetIds.map((pid: string) => ({
      pet_id: pid,
      title: taskData.title,
      scheduled_date: taskData.scheduled_date,
      scheduled_time: taskData.scheduled_time,
      notes: taskData.notes,
      completed: false
    }));

    try {
      const { data, error } = await supabase
        .from('pet_tasks')
        .insert(dbTasks)
        .select();

      if (error) throw error;
      if (data) setPetTasks(currentPetTasks => [...data, ...currentPetTasks]);
      return true;
    } catch (error) {
      console.error('Error adding pet tasks:', error);
      return false;
    }
  };

  const completePetTask = async (id: string) => {
    if (!memberId) return false;
    const completedDate = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('pet_tasks')
        .update({ completed: true, completed_date: completedDate, completed_by: memberId })
        .eq('id', id);

      if (error) throw error;
      setPetTasks(currentPetTasks => currentPetTasks.map(t =>
        t.id === id ? { ...t, completed: true, completed_date: completedDate, completed_by: memberId } : t
      ));
      await loadData();
      return true;
    } catch (error) {
      console.error('Error completing pet task:', error);
      return false;
    }
  };

  const reopenPetTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pet_tasks')
        .update({ completed: false, completed_date: null, completed_by: null })
        .eq('id', id);

      if (error) throw error;
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
      const { error } = await supabase
        .from('pet_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
    setPetTasks, 
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
