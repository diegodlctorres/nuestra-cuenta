import { supabase } from './supabase';
import { fetchHouseholdMemberProfiles, mapMemberWithProfile } from './householdProfiles';
import { Pet, PetTask, PetTaskInput } from '../types';

export interface PetsSnapshot {
  pets: Pet[];
  petTasks: PetTask[];
}

export async function fetchPets(householdId: string) {
  const response = await supabase
    .from('pets')
    .select('*')
    .eq('household_id', householdId)
    .order('name');

  if (response.error) {
    throw response.error;
  }

  return (response.data || []) as Pet[];
}

export async function fetchPetTasks(pets: Pet[], householdId: string) {
  if (pets.length === 0) {
    return [] as PetTask[];
  }

  const memberProfiles = await fetchHouseholdMemberProfiles();
  const completedByMemberMap = new Map(
    memberProfiles.map(row => [row.member_id, mapMemberWithProfile(row, householdId)])
  );

  const response = await supabase
    .from('pet_tasks')
    .select('*')
    .in('pet_id', pets.map(pet => pet.id))
    .order('scheduled_date', { ascending: true });

  if (response.error) {
    throw response.error;
  }

  return ((response.data || []) as PetTask[]).map(task => ({
    ...task,
    completedByMember: task.completed_by ? completedByMemberMap.get(task.completed_by) : undefined
  })) as PetTask[];
}

export async function loadPetsSnapshot(householdId: string): Promise<PetsSnapshot> {
  const pets = await fetchPets(householdId);
  const petTasks = await fetchPetTasks(pets, householdId);

  return {
    pets,
    petTasks
  };
}

export async function createPet(householdId: string, pet: Omit<Pet, 'id' | 'household_id'>) {
  const response = await supabase
    .from('pets')
    .insert({ ...pet, household_id: householdId })
    .select()
    .single();

  if (response.error) {
    throw response.error;
  }

  return response.data as Pet;
}

export async function editPet(householdId: string, pet: Pet) {
  const response = await supabase
    .from('pets')
    .update({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || null,
      birth_date: pet.birth_date || null,
      photo_url: pet.photo_url || null
    })
    .eq('id', pet.id)
    .eq('household_id', householdId)
    .select()
    .single();

  if (response.error) {
    throw response.error;
  }

  return response.data as Pet;
}

export async function removePet(householdId: string, petId: string) {
  const response = await supabase
    .from('pets')
    .delete()
    .eq('id', petId)
    .eq('household_id', householdId);

  if (response.error) {
    throw response.error;
  }
}

export async function createPetTasks(task: PetTaskInput, pets: Pet[]) {
  const { petIds, ...taskData } = task;
  const currentPetIds = new Set(pets.map(pet => pet.id));
  const validPetIds = petIds.filter(petId => currentPetIds.has(petId));

  if (validPetIds.length === 0) {
    return [] as PetTask[];
  }

  const dbTasks = validPetIds.map(petId => ({
    pet_id: petId,
    title: taskData.title,
    scheduled_date: taskData.scheduled_date,
    scheduled_time: taskData.scheduled_time,
    notes: taskData.notes,
    completed: false
  }));

  const response = await supabase
    .from('pet_tasks')
    .insert(dbTasks)
    .select();

  if (response.error) {
    throw response.error;
  }

  return (response.data || []) as PetTask[];
}

export async function completePetTaskRecord(id: string, memberId: string, householdId: string) {
  const response = await supabase.rpc('complete_pet_task', {
    p_household_id: householdId,
    p_pet_task_id: id
  });

  if (response.error) {
    throw response.error;
  }

  const completedTask = Array.isArray(response.data) ? response.data[0] : null;
  const completedDate = completedTask?.completed_date || new Date().toISOString();
  const completedBy = completedTask?.completed_by || memberId;
  const memberProfiles = await fetchHouseholdMemberProfiles();
  const completedByMember = memberProfiles.find(profile => profile.member_id === completedBy);

  return {
    completedDate,
    completedByMember: completedByMember ? mapMemberWithProfile(completedByMember, householdId) : undefined
  };
}

export async function reopenPetTaskRecord(id: string, householdId: string) {
  const response = await supabase.rpc('reopen_pet_task', {
    p_household_id: householdId,
    p_pet_task_id: id
  });

  if (response.error) {
    throw response.error;
  }
}

export async function removePetTask(id: string, householdId: string) {
  const response = await supabase.rpc('delete_pet_task', {
    p_household_id: householdId,
    p_pet_task_id: id
  });

  if (response.error) {
    throw response.error;
  }
}
