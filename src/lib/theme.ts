import { ThemeType } from '../types';

export const THEME_STORAGE_KEY = 'nuestra-cuenta.theme';

const THEMES = ['default', 'oceanic', 'nature', 'sunset'] as const;

export function isThemeType(value: unknown): value is ThemeType {
  return typeof value === 'string' && THEMES.includes(value as ThemeType);
}

export function applyTheme(theme: ThemeType) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function persistTheme(theme: ThemeType) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in restricted browser modes.
  }
}

export function applyStoredTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (isThemeType(storedTheme)) {
      applyTheme(storedTheme);
    }
  } catch {
    // Keep the CSS default if storage cannot be read.
  }
}
