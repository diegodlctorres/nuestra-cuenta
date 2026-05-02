import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CoupleSettings, Partner, Profile, ThemeType } from '../types';

interface HouseholdProfileRow {
  id: string;
  name: string;
  nickname?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  avatar_url?: string | null;
}

export function useSettings() {
  const { user, profile, householdId, refreshProfile } = useAuth();
  const [coupleSettings, setCoupleSettingsState] = useState<CoupleSettings>({
    partner1: { name: '' },
    partner2: { name: '' },
    theme: 'default'
  });

  const mapProfileToPartner = useCallback((profileData?: HouseholdProfileRow | Profile | null, isCurrentUser: boolean = false): Partner => {
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
  }, []);

  const loadHouseholdProfiles = useCallback(async () => {
    if (!user || !profile) {
      return;
    }

    try {
      const currentPartner = mapProfileToPartner(profile, true);
      let partner2: Partner = { name: '' };

      if (householdId) {
        const { data, error } = await supabase.rpc('get_household_profiles');

        if (error) {
          throw error;
        }

        const otherProfile = (data || []).find((item: HouseholdProfileRow) => item.id !== user.id);
        partner2 = mapProfileToPartner(otherProfile || null, false);
      }

      setCoupleSettingsState(prev => ({
        ...prev,
        partner1: currentPartner,
        partner2
      }));
    } catch (error) {
      console.error('Error loading household profiles:', error);
      setCoupleSettingsState(prev => ({
        ...prev,
        partner1: mapProfileToPartner(profile, true)
      }));
    }
  }, [householdId, mapProfileToPartner, profile, user]);

  const loadHouseholdTheme = useCallback(async () => {
    if (!householdId) {
      setCoupleSettingsState(prev => ({
        ...prev,
        theme: 'default'
      }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('households')
        .select('theme')
        .eq('id', householdId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setCoupleSettingsState(prev => ({
        ...prev,
        theme: (data?.theme as ThemeType | undefined) || 'default'
      }));
    } catch (error) {
      console.error('Error loading household theme:', error);
    }
  }, [householdId]);

  useEffect(() => {
    if (coupleSettings.theme) {
      document.documentElement.setAttribute('data-theme', coupleSettings.theme);
    }
  }, [coupleSettings.theme]);

  useEffect(() => {
    loadHouseholdProfiles();
  }, [loadHouseholdProfiles]);

  useEffect(() => {
    loadHouseholdTheme();
  }, [loadHouseholdTheme]);

  const setCoupleSettings = useCallback(async (nextSettings: CoupleSettings) => {
    const nextTheme = nextSettings.theme || 'default';
    const themeChanged = nextTheme !== (coupleSettings.theme || 'default');

    setCoupleSettingsState(prev => ({
      ...prev,
      theme: nextTheme
    }));

    if (!user) {
      return;
    }

    const editablePartner =
      nextSettings.partner1.id === user.id
        ? nextSettings.partner1
        : nextSettings.partner2.id === user.id
          ? nextSettings.partner2
          : null;

    if (editablePartner) {
      setCoupleSettingsState(prev => ({
        ...prev,
        partner1: prev.partner1.id === user.id ? { ...editablePartner, isCurrentUser: true } : prev.partner1,
        partner2: prev.partner2.id === user.id ? { ...editablePartner, isCurrentUser: true } : prev.partner2
      }));
    }

    try {
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
          .eq('id', user.id);

        if (error) {
          throw error;
        }
      }

      await refreshProfile();
      await loadHouseholdProfiles();
    } catch (error) {
      console.error('Error saving couple settings:', error);
      await loadHouseholdTheme();
      await loadHouseholdProfiles();
    }
  }, [coupleSettings.theme, householdId, loadHouseholdProfiles, loadHouseholdTheme, refreshProfile, user]);

  return { coupleSettings, setCoupleSettings };
}
