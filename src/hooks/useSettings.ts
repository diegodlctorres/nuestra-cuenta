import { useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { CoupleSettings } from '../types';
import { isOffline, OFFLINE_MUTATION_MESSAGE } from '../lib/networkStatus';
import { loadSettingsSnapshot, persistCoupleSettings } from '../lib/settingsData';
import { queryKeys } from '../lib/queryKeys';

export function useSettings() {
  const { user, profile, householdId, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const fallbackSettings: CoupleSettings = {
    partner1: { name: '' },
    partner2: { name: '' },
    theme: 'default'
  };
  const settingsQuery = useQuery({
    queryKey: queryKeys.settings(householdId, user?.id || null),
    queryFn: async () => loadSettingsSnapshot(user!.id, profile ?? null, householdId),
    enabled: Boolean(user && profile),
    initialData: fallbackSettings
  });
  const coupleSettings = settingsQuery.data ?? fallbackSettings;

  useEffect(() => {
    if (coupleSettings.theme) {
      document.documentElement.setAttribute('data-theme', coupleSettings.theme);
    }
  }, [coupleSettings.theme]);

  const setCoupleSettingsMutation = useMutation({
    mutationFn: async (nextSettings: CoupleSettings) => {
      if (!user) {
        return;
      }

      return persistCoupleSettings(
        user.id,
        householdId,
        coupleSettings.theme || 'default',
        nextSettings
      );
    },
    onMutate: async (nextSettings) => {
      const queryKey = queryKeys.settings(householdId, user?.id || null);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CoupleSettings>(queryKey);
      queryClient.setQueryData<CoupleSettings>(queryKey, {
        ...nextSettings,
        theme: nextSettings.theme || 'default'
      });
      return { previous };
    },
    onError: (_error, _nextSettings, context) => {
      const queryKey = queryKeys.settings(householdId, user?.id || null);
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: async (result, nextSettings) => {
      const queryKey = queryKeys.settings(householdId, user?.id || null);

      queryClient.setQueryData<CoupleSettings>(queryKey, (current) => {
        const baseSettings = current || fallbackSettings;
        const normalizedTheme = result?.nextTheme || nextSettings.theme || 'default';

        if (!result?.editablePartner || !user) {
          return {
            ...nextSettings,
            theme: normalizedTheme
          };
        }

        return {
          ...baseSettings,
          theme: normalizedTheme,
          partner1: baseSettings.partner1.id === user.id
            ? { ...result.editablePartner, isCurrentUser: true }
            : baseSettings.partner1,
          partner2: baseSettings.partner2.id === user.id
            ? { ...result.editablePartner, isCurrentUser: true }
            : baseSettings.partner2
        };
      });

      await refreshProfile();
    }
  });

  const setCoupleSettings = useCallback(async (nextSettings: CoupleSettings) => {
    if (isOffline()) {
      console.warn(OFFLINE_MUTATION_MESSAGE);
      return false;
    }
    try {
      await setCoupleSettingsMutation.mutateAsync(nextSettings);
      return true;
    } catch (error) {
      console.error('Error saving couple settings:', error);
      return false;
    }
  }, [setCoupleSettingsMutation]);

  return { coupleSettings, setCoupleSettings };
}
