/** Priority order for standup sorting (lower = higher urgency). */
export const PRIORITY_SORT_ORDER: Record<string, number> = {
  "[P1]": 0,
  "[P2]": 1,
  "For Release": 2,
  Pending: 3,
  "On Hold": 4,
  Online: 5,
  Removed: 6,
  Cancelled: 7,
};

/** Phase order for standup sorting (pipeline order). */
export const PHASE_SORT_ORDER: Record<string, number> = {
  "Setting up requirements": 0,
  Development: 1,
  "Internal Testing": 2,
  "External Testing": 3,
  "Submit the app for review": 4,
  "Go live": 5,
};

/** Default filter hides settled / offline priorities for standup focus. */
export const ACTIVE_PRIORITIES = new Set([
  "[P1]",
  "[P2]",
  "Pending",
  "For Release",
  "On Hold",
]);

export const PRIORITY_OPTIONS = [
  "[P1]",
  "[P2]",
  "Pending",
  "For Release",
  "On Hold",
  "Online",
  "Removed",
  "Cancelled",
] as const;

export const PHASE_OPTIONS = [
  "Setting up requirements",
  "Development",
  "Internal Testing",
  "External Testing",
  "Submit the app for review",
  "Go live",
] as const;

export type TrackerSubTab = "internal" | "external";

export function prioritySortKey(priority: string): number {
  return PRIORITY_SORT_ORDER[priority] ?? 50;
}

export function phaseSortKey(phase: string): number {
  return PHASE_SORT_ORDER[phase] ?? 50;
}

export function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "[P1]":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30";
    case "[P2]":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30";
    case "For Release":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30";
    case "Pending":
      return "bg-sky-500/15 text-sky-800 dark:text-sky-300 ring-1 ring-sky-500/30";
    case "On Hold":
      return "bg-orange-500/15 text-orange-800 dark:text-orange-300 ring-1 ring-orange-500/30";
    case "Online":
      return "bg-fg/8 text-fg-muted ring-1 ring-border";
    case "Removed":
    case "Cancelled":
      return "bg-fg/5 text-fg-subtle line-through ring-1 ring-border";
    default:
      return "bg-panel text-fg-muted ring-1 ring-border";
  }
}

export function phaseBadgeClass(phase: string): string {
  switch (phase) {
    case "Setting up requirements":
      return "bg-violet-500/12 text-violet-800 dark:text-violet-300";
    case "Development":
      return "bg-sky-500/12 text-sky-800 dark:text-sky-300";
    case "Internal Testing":
      return "bg-amber-500/12 text-amber-800 dark:text-amber-300";
    case "External Testing":
      return "bg-orange-500/12 text-orange-800 dark:text-orange-300";
    case "Submit the app for review":
      return "bg-indigo-500/12 text-indigo-800 dark:text-indigo-300";
    case "Go live":
      return "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300";
    default:
      return "bg-panel text-fg-muted";
  }
}
