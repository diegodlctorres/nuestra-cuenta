import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Pet, PetTask } from '../types';

export function usePets() {
  const { householdId } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petTasks, setPetTasks] = useState<PetTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      // Load Pets
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', householdId)
        .order('name');

      if (petsError) throw petsError;

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
        tasksData = data || [];
      }

      setPets(petsData || []);
      setPetTasks(tasksData);
    } catch (error) {
      console.error('Error loading pet data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadData();
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  const pendingPetTasksCount = useMemo(() =>
    petTasks.filter(t => !t.completed).length
  , [petTasks]);

  const uploadPetPhoto = async (petId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${petId}-${Math.random()}.${fileExt}`;
    const filePath = `pet-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public-assets') // Make sure this bucket exists and is public
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('public-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const addPet = async (pet: Omit<Pet, 'id' | 'household_id'>, photoFile?: File) => {
    if (!householdId) return;
    try {
      // 1. Create Pet record first to get ID
      const { data: newPet, error } = await supabase
        .from('pets')
        .insert({ ...pet, household_id: householdId })
        .select()
        .single();

      if (error) throw error;
      
      let finalPet = newPet;

      // 2. Upload photo if exists and update record
      if (photoFile && newPet) {
        const publicUrl = await uploadPetPhoto(newPet.id, photoFile);
        const { data: updatedPet, error: updateError } = await supabase
          .from('pets')
          .update({ photo_url: publicUrl })
          .eq('id', newPet.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        finalPet = updatedPet;
      }

      setPets([...pets, finalPet]);
    } catch (error) {
      console.error('Error adding pet:', error);
    }
  };

  const updatePet = async (updatedPet: Pet, photoFile?: File) => {
    try {
      let photoUrl = updatedPet.photo_url;
      
      if (photoFile) {
        photoUrl = await uploadPetPhoto(updatedPet.id, photoFile);
      }

      const { data, error } = await supabase
        .from('pets')
        .update({ ...updatedPet, photo_url: photoUrl })
        .eq('id', updatedPet.id)
        .select()
        .single();

      if (error) throw error;
      setPets(pets.map(p => p.id === updatedPet.id ? data : p));
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

  const addPetTask = async (task: any) => {
    const { petIds, ...taskData } = task; // Front-end format with plural petIds
    
    const dbTasks = petIds.map((pid: string) => ({
      pet_id: pid,
      title: taskData.title,
      scheduled_date: taskData.scheduledDate || taskData.scheduled_date,
      scheduled_time: taskData.scheduledTime || taskData.scheduled_time,
      notes: taskData.notes,
      completed: false
    }));

    try {
      const { data, error } = await supabase
        .from('pet_tasks')
        .insert(dbTasks)
        .select();

      if (error) throw error;
      if (data) setPetTasks([...data, ...petTasks]);
    } catch (error) {
      console.error('Error adding pet tasks:', error);
    }
  };

  const completePetTask = async (id: string) => {
    const completedDate = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('pet_tasks')
        .update({ completed: true, completed_date: completedDate })
        .eq('id', id);

      if (error) throw error;
      setPetTasks(petTasks.map(t =>
        t.id === id ? { ...t, completed: true, completed_date: completedDate } : t
      ));
    } catch (error) {
      console.error('Error completing pet task:', error);
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
    isLoading 
  };
}
