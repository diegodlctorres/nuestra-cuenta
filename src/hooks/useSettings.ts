import { useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { CoupleSettings } from '../types';
import { MutationResult, mutationError, mutationMessage, mutationOk } from '../lib/errors';
import { isOffline, OFFLINE_MUTATION_MESSAGE } from '../lib/networkStatus';
import { loadSettingsSnapshot, persistCoupleSettings } from '../lib/settingsData';
import { queryKeys } from '../lib/queryKeys';
import { applyTheme, persistTheme } from '../lib/theme';

export function useSettings() {
  const { user, profile, householdId, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const fallbackSettings: CoupleSettings = {
    partner1: { name: '' },
    partner2: { name: '' }
  };
  const settingsQuery = useQuery({
    queryKey: queryKeys.settings(householdId, user?.id || null),
    queryFn: async () => loadSettingsSnapshot(user!.id, profile ?? null, householdId),
    enabled: Boolean(user && profile)
  });
  const coupleSettings = settingsQuery.data ?? fallbackSettings;

  useEffect(() => {
    if (settingsQuery.data?.theme) {
      applyTheme(settingsQuery.data.theme);
      persistTheme(settingsQuery.data.theme);
    }
  }, [settingsQuery.data?.theme]);

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
        applyTheme(normalizedTheme);
        persistTheme(normalizedTheme);

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

  const setCoupleSettings = useCallback(async (nextSettings: CoupleSettings): Promise<MutationResult> => {
    if (isOffline()) {
      return mutationMessage(OFFLINE_MUTATION_MESSAGE);
    }
    try {
      await setCoupleSettingsMutation.mutateAsync(nextSettings);
      return mutationOk();
    } catch (error) {
      console.error('Error saving couple settings:', error);
      return mutationError(error, 'No se pudo guardar la configuración.');
    }
  }, [setCoupleSettingsMutation]);

  return { coupleSettings, setCoupleSettings, isLoading: settingsQuery.isLoading };
}
