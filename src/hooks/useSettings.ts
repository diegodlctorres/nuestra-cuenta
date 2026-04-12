import { useState, useEffect } from 'react';
import { CoupleSettings, Category } from '../types';

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
      partner2: { name: 'Luis' }
    };
  });

  useEffect(() => {
    localStorage.setItem('nc_couple_settings', JSON.stringify(coupleSettings));
  }, [coupleSettings]);

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('nc_categories');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'General', type: 'expenses' },
      { id: '2', name: 'Comida', type: 'expenses' },
      { id: '3', name: 'Salidas', type: 'expenses' },
      { id: '4', name: 'Viajes', type: 'expenses' },
      { id: '5', name: 'Mascotas', type: 'expenses' },
      { id: '6', name: 'Sueldo/Ingreso', type: 'savings' },
      { id: '7', name: 'Inversión', type: 'savings' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nc_categories', JSON.stringify(categories));
  }, [categories]);

  return { coupleSettings, setCoupleSettings, categories, setCategories };
}
