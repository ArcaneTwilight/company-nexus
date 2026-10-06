import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggle, isDark } = useTheme();
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={!isDark}
      title={label}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-panel text-fg-muted hover:text-fg hover:border-border-strong glass-button focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
