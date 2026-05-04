import { supabase } from './supabase';
import { HouseholdMember, Profile } from '../types';

export interface HouseholdMemberProfileRow {
  member_id: string;
  profile_id: string;
  name: string;
  nickname?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  avatar_url?: string | null;
  joined_at?: string | null;
}

export function mapMemberProfile(row: HouseholdMemberProfileRow): Profile {
  return {
    id: row.profile_id,
    name: row.name,
    nickname: row.nickname || undefined,
    gender: row.gender || undefined,
    birth_date: row.birth_date || undefined,
    avatar_url: row.avatar_url || undefined
  };
}

export function mapMemberWithProfile(
  row: HouseholdMemberProfileRow,
  householdId: string
): HouseholdMember {
  return {
    id: row.member_id,
    household_id: householdId,
    profile_id: row.profile_id,
    role: 'member',
    status: 'active',
    joined_at: row.joined_at || '',
    profile: mapMemberProfile(row)
  };
}

export async function fetchHouseholdMemberProfiles() {
  const { data, error } = await supabase.rpc('get_household_member_profiles');

  if (error) {
    throw error;
  }

  return (data || []) as HouseholdMemberProfileRow[];
}
