export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "nexus_theme";

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/** Default is light when missing or invalid. */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
  applyTheme(theme);
}

export function toggleTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}
