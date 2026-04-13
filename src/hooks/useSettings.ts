import { useState, useEffect } from 'react';
import { CoupleSettings } from '../types';

export function useSettings() {
  const [coupleSettings, setCoupleSettings] = useState<CoupleSettings>(() => {
    const saved = localStorage.getItem('nc_couple_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.partner1 === 'string') {
        return {
          partner1: { name: parsed.partner1 },
          partner2: { name: parsed.partner2 }
        };
      }
      return parsed;
    }
    return {
      partner1: { name: 'Ariana' },
      partner2: { name: 'Luis' },
      theme: 'default'
    };
  });

  useEffect(() => {
    localStorage.setItem('nc_couple_settings', JSON.stringify(coupleSettings));
    if (coupleSettings.theme) {
      document.documentElement.setAttribute('data-theme', coupleSettings.theme);
    }
  }, [coupleSettings]);

  return { coupleSettings, setCoupleSettings };
}
