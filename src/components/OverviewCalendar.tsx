import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, List } from "lucide-react";
import type { CalendarEvent } from "../types";
import {
  CALENDAR_TYPE_CONFIG,
  daysUntil,
  formatCalendarDate,
  getUpcomingEvents,
  todayISO,
} from "../lib/calendar";
import { SegmentedTabs } from "./motion";

interface OverviewCalendarProps {
  events: CalendarEvent[];
  onOpenCalendar?: () => void;
  compact?: boolean;
}

type OverviewView = "month" | "upcoming";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COMPACT_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function OverviewCalendar({
  events,
  onOpenCalendar,
  compact = false,
}: OverviewCalendarProps) {
  const [view, setView] = useState<OverviewView>(compact ? "upcoming" : "month");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = todayISO();
  const upcoming = useMemo(() => getUpcomingEvents(events, 5), [events]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ day: number | null; dateKey: string | null }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, dateKey: null });
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, dateKey });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, dateKey: null });

  function shiftMonth(delta: number) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <div
      className={`h-full rounded-2xl glass-container border border-border flex flex-col ${
        compact ? "p-4 sm:p-5" : "p-5"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>Team Calendar</span>
        </h3>
        {onOpenCalendar && (
          <button
            type="button"
            onClick={onOpenCalendar}
            className="text-[11px] font-mono text-fg-subtle hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer"
          >
            Open full →
          </button>
        )}
      </div>

      <SegmentedTabs
        tabs={[
          { id: "month", label: "Month", icon: <Calendar className="w-3.5 h-3.5" /> },
          { id: "upcoming", label: "Upcoming", icon: <List className="w-3.5 h-3.5" /> },
        ]}
        activeId={view}
        onChange={(id) => setView(id as OverviewView)}
        layoutId="overview-calendar-view"
        className="mb-4"
      />

      {view === "month" ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-1.5 rounded-lg border border-border text-fg-muted hover:text-fg hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-semibold text-fg font-display">{monthLabel}</p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-1.5 rounded-lg border border-border text-fg-muted hover:text-fg hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {(compact ? COMPACT_WEEKDAYS : WEEKDAYS).map((label, index) => (
              <div
                key={`${label}-${index}`}
                className="text-center text-[10px] font-mono uppercase tracking-wider text-fg-subtle py-1"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 flex-1">
            {cells.map((cell, index) => {
              if (!cell.day || !cell.dateKey) {
                return <div key={`empty-${index}`} className={compact ? "min-h-[2rem]" : "min-h-[2.4rem]"} />;
              }

              const dayEvents = eventsByDate.get(cell.dateKey) ?? [];
              const hasEvents = dayEvents.length > 0;
              const isToday = cell.dateKey === today;
              const tooltip = dayEvents
                .map((event) => `${event.title} (${event.type})`)
                .join("\n");

              return (
                <div
                  key={cell.dateKey}
                  className={`relative group/day rounded-lg border p-1 flex flex-col items-center justify-start transition-colors ${
                    compact ? "min-h-[2rem]" : "min-h-[2.4rem]"
                  } ${
                    isToday
                      ? "border-sky-500/40 bg-sky-500/10"
                      : hasEvents
                        ? "border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06]"
                        : "border-transparent hover:bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`font-mono leading-none ${
                      compact ? "text-[10px]" : "text-[11px]"
                    } ${
                      isToday ? "text-sky-700 dark:text-sky-300 font-semibold" : "text-fg-muted"
                    }`}
                  >
                    {cell.day}
                  </span>

                  {hasEvents && (
                    <>
                      <div className="mt-1 flex items-center justify-center gap-0.5 flex-wrap max-w-full">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            className={`w-1.5 h-1.5 rounded-full ${CALENDAR_TYPE_CONFIG[event.type].accent}`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-fg-subtle font-mono">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>

                      <div
                        role="tooltip"
                        className="pointer-events-none absolute left-1/2 bottom-full z-30 mb-2 w-max max-w-[14rem] -translate-x-1/2 rounded-lg border border-border bg-panel-elevated px-2.5 py-2 opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover/day:opacity-100"
                      >
                        <p className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle mb-1">
                          {formatCalendarDate(cell.dateKey)}
                        </p>
                        <ul className="space-y-1">
                          {dayEvents.map((event) => (
                            <li key={event.id} className="flex items-start gap-1.5">
                              <span
                                className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${CALENDAR_TYPE_CONFIG[event.type].accent}`}
                              />
                              <span className="text-[11px] text-fg leading-snug">
                                {event.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <span className="sr-only">{tooltip}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-2 min-h-0 overflow-y-auto">
          {upcoming.length === 0 ? (
            <p className="text-xs text-fg-subtle font-mono py-8 text-center">
              No upcoming events.
            </p>
          ) : (
            upcoming.map((event) => {
              const config = CALENDAR_TYPE_CONFIG[event.type];
              const urgency = daysUntil(event.date);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={onOpenCalendar}
                  className="w-full text-left p-3 rounded-xl border border-border bg-panel hover:border-border-strong hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${config.accent}`} />
                    <span className="text-[11px] font-mono text-fg-subtle">
                      {formatCalendarDate(event.date)}
                    </span>
                    <span
                      className={`text-[10px] font-mono ml-auto ${
                        urgency === "Today"
                          ? "text-amber-400"
                          : urgency === "Tomorrow"
                            ? "text-sky-400"
                            : "text-fg-subtle"
                      }`}
                    >
                      {urgency}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-fg truncate">{event.title}</p>
                  <p className="text-[11px] text-fg-subtle font-mono mt-0.5">{event.type}</p>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
