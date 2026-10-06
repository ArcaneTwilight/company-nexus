import { FileText, Upload, Rocket, Users, type LucideIcon } from "lucide-react";
import type { CalendarEvent, CalendarEventType } from "../types";

export const CALENDAR_EVENT_TYPES: CalendarEventType[] = [
  "Report",
  "Event",
  "Upload",
  "Release",
];

export const CALENDAR_TYPE_CONFIG: Record<
  CalendarEventType,
  { icon: LucideIcon; color: string; dot: string; accent: string }
> = {
  Report: {
    icon: FileText,
    color: "text-sky-800 dark:text-sky-300 bg-sky-500/10 border-sky-500/20",
    dot: "bg-sky-400",
    accent: "bg-sky-400",
  },
  Event: {
    icon: Users,
    color: "text-indigo-800 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
    dot: "bg-indigo-400",
    accent: "bg-indigo-400",
  },
  Upload: {
    icon: Upload,
    color: "text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400",
    accent: "bg-amber-400",
  },
  Release: {
    icon: Rocket,
    color: "text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400",
    accent: "bg-emerald-400",
  },
};

export function formatCalendarDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(dateStr: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Past";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function getUpcomingEvents(events: CalendarEvent[], limit = 5): CalendarEvent[] {
  const today = todayISO();
  return [...events]
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
    .slice(0, limit);
}

export function createCalendarEventId() {
  return `cal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
