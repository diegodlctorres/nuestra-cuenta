import { supabase } from './supabase';
import { CoupleSettings, Partner, Profile, ThemeType } from '../types';

interface HouseholdProfileRow {
  id: string;
  name: string;
  nickname?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  avatar_url?: string | null;
}

export function mapProfileToPartner(
  profileData?: HouseholdProfileRow | Profile | null,
  isCurrentUser: boolean = false
): Partner {
  if (!profileData) {
    return {
      name: '',
      isCurrentUser
    };
  }

  return {
    id: profileData.id,
    name: profileData.name || '',
    nickname: profileData.nickname || '',
    gender: profileData.gender || '',
    birthDate: profileData.birth_date || '',
    photoUrl: profileData.avatar_url || '',
    isCurrentUser
  };
}

export async function loadSettingsSnapshot(
  userId: string,
  profile: Profile | null,
  householdId: string | null
): Promise<CoupleSettings> {
  const currentPartner = mapProfileToPartner(profile, true);
  let partner2: Partner = { name: '' };
  let theme: ThemeType = 'default';

  if (householdId) {
    const [{ data: householdProfiles, error: profilesError }, { data: household, error: householdError }] =
      await Promise.all([
        supabase.rpc('get_household_profiles'),
        supabase
          .from('households')
          .select('theme')
          .eq('id', householdId)
          .maybeSingle()
      ]);

    if (profilesError) {
      throw profilesError;
    }

    if (householdError) {
      throw householdError;
    }

    const otherProfile = ((householdProfiles || []) as HouseholdProfileRow[]).find((item) => item.id !== userId);
    partner2 = mapProfileToPartner(otherProfile || null, false);
    theme = (household?.theme as ThemeType | undefined) || 'default';
  }

  return {
    partner1: currentPartner,
    partner2,
    theme
  };
}

export async function persistCoupleSettings(
  userId: string,
  householdId: string | null,
  currentTheme: ThemeType,
  nextSettings: CoupleSettings
) {
  const nextTheme = nextSettings.theme || 'default';
  const themeChanged = nextTheme !== (currentTheme || 'default');

  const editablePartner =
    nextSettings.partner1.id === userId
      ? nextSettings.partner1
      : nextSettings.partner2.id === userId
        ? nextSettings.partner2
        : null;

  if (themeChanged && householdId) {
    const { error: householdError } = await supabase
      .from('households')
      .update({ theme: nextTheme })
      .eq('id', householdId);

    if (householdError) {
      throw householdError;
    }
  }

  if (editablePartner) {
    const updates = {
      name: editablePartner.name,
      nickname: editablePartner.nickname || null,
      gender: editablePartner.gender || null,
      birth_date: editablePartner.birthDate || null,
      avatar_url: editablePartner.photoUrl || null
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      throw error;
    }
  }

  return {
    nextTheme,
    editablePartner
  };
}
