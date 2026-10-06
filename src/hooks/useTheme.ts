import { useEffect, useState, useSyncExternalStore } from "react";
import {
  applyTheme,
  getStoredTheme,
  setStoredTheme,
  THEME_STORAGE_KEY,
  toggleTheme,
  type Theme,
} from "../lib/theme";

function subscribe(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) onStoreChange();
  };
  const onThemeChange = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener("nexus-theme-change", onThemeChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("nexus-theme-change", onThemeChange);
  };
}

function getSnapshot(): Theme {
  return getStoredTheme();
}

function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    applyTheme(theme);
    setMounted(true);
  }, [theme]);

  function setTheme(next: Theme) {
    setStoredTheme(next);
    window.dispatchEvent(new Event("nexus-theme-change"));
  }

  function toggle() {
    setTheme(toggleTheme(theme));
  }

  return { theme, setTheme, toggle, isDark: theme === "dark", mounted };
}
