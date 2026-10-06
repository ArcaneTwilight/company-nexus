import { type ReactNode } from "react";
import { motion } from "motion/react";
import { durations, transitions } from "../../lib/motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      className={`relative px-3 py-1 rounded-full text-xs font-medium cursor-pointer shrink-0 border transition-colors ${
        active
          ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border-sky-500/30 text-sky-700 dark:text-sky-300"
          : "bg-panel border-border text-fg-subtle hover:text-fg hover:border-border-strong"
      }`}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ duration: durations.fast }}
      aria-pressed={active}
    >
      {active && !reduced && (
        <motion.span
          layoutId="filter-chip-glow"
          className="absolute inset-0 rounded-full bg-sky-500/5 pointer-events-none"
          transition={transitions.layout}
        />
      )}
      <span className="relative z-10">{label}</span>
    </motion.button>
  );
}

interface SegmentedTab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export function SegmentedTabs({
  tabs,
  activeId,
  onChange,
  className = "",
  layoutId = "segmented-indicator",
}: SegmentedTabsProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className={`flex gap-1 p-1 bg-panel border border-border rounded-xl ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isActive ? "text-sky-700 dark:text-sky-300" : "text-fg-subtle hover:text-fg"
            }`}
          >
            {isActive && !reduced && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-500/30"
                transition={transitions.layout}
              />
            )}
            {isActive && reduced && (
              <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-500/30" />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              <span>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface NavTabsProps {
  tabs: SegmentedTab[];
  activeId: string;
  onChange: (id: string) => void;
}

export function NavTabs({ tabs, activeId, onChange }: NavTabsProps) {
  const reduced = useReducedMotion();

  return (
    <nav className="p-2 rounded-2xl bg-panel border border-border flex gap-1.5 overflow-x-auto relative cyber-nav">
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors ${
              isActive ? "text-accent" : "text-fg-subtle hover:text-fg"
            }`}
          >
            {isActive && !reduced && (
              <motion.span
                layoutId="main-nav-indicator"
                className="absolute inset-0 rounded-xl bg-accent/10 border border-accent/40 shadow-lg shadow-accent/10"
                transition={transitions.layout}
              />
            )}
            {isActive && reduced && (
              <span className="absolute inset-0 rounded-xl bg-accent/10 border border-accent/40" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              <span>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
