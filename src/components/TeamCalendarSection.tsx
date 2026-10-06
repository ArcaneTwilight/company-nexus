import { useState, useEffect, Fragment, useMemo } from "react";
import { CalendarEvent, CalendarEventType } from "../types";
import {
  Calendar,
  AlertTriangle,
  ChevronDown,
  Plus,
  Pencil,
} from "lucide-react";
import { SearchInput } from "./SearchInput";
import { LayoutGroup } from "motion/react";
import { FilterChip, EmptyState, StaggerGrid, StaggerItem, GlassCard, GlassButton } from "./motion";
import { CalendarEventModal } from "./CalendarEventModal";
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_TYPE_CONFIG,
  daysUntil,
  formatCalendarDate,
  todayISO,
} from "../lib/calendar";

interface TeamCalendarSectionProps {
  events: CalendarEvent[];
  initialSearch?: string;
  onUpsert: (event: CalendarEvent) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TeamCalendarSection({
  events,
  initialSearch = "",
  onUpsert,
  onDelete,
}: TeamCalendarSectionProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState<CalendarEventType | "All">("All");
  const [showPast, setShowPast] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const types: Array<CalendarEventType | "All"> = ["All", ...CALENDAR_EVENT_TYPES];

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  const today = todayISO();

  const filteredEvents = sortedEvents.filter((event) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.owner.toLowerCase().includes(query);
    const matchesType = selectedType === "All" || event.type === selectedType;
    const isPast = event.date < today;
    const matchesTime = showPast || !isPast;
    return matchesSearch && matchesType && matchesTime;
  });

  const upcomingCount = events.filter((e) => e.date >= today).length;

  function openCreate() {
    setEditingEvent(null);
    setModalOpen(true);
  }

  function openEdit(event: CalendarEvent) {
    setEditingEvent(event);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingEvent(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-panel p-4 rounded-xl border border-border">
        <div className="w-full md:w-80">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search deadlines and events..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-between md:justify-end">
          <LayoutGroup>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <Calendar className="w-4 h-4 text-fg-muted shrink-0" />
              {types.map((type) => (
                <Fragment key={type}>
                  <FilterChip
                    label={type}
                    active={selectedType === type}
                    onClick={() => setSelectedType(type)}
                  />
                </Fragment>
              ))}
            </div>
          </LayoutGroup>

          <GlassButton
            variant="primary"
            onClick={openCreate}
            iconRight={<Plus className="w-4 h-4" />}
          >
            Add event
          </GlassButton>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-fg-subtle font-mono">
          {upcomingCount} upcoming deadline{upcomingCount !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowPast(!showPast)}
          className="text-xs text-fg-muted hover:text-fg transition-colors font-mono flex items-center gap-1 cursor-pointer"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showPast ? "rotate-180" : ""}`}
          />
          {showPast ? "Hide past" : "Show past"}
        </button>
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          message="No calendar events found matching search parameters."
        />
      ) : (
        <StaggerGrid className="space-y-3">
          {filteredEvents.map((event, index) => {
            const config = CALENDAR_TYPE_CONFIG[event.type];
            const Icon = config.icon;
            const isPast = event.date < today;
            const urgency = daysUntil(event.date);

            return (
              <Fragment key={event.id}>
                <StaggerItem>
                  <GlassCard
                    index={index}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
                      isPast ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:w-48 shrink-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${config.dot} ${
                          urgency === "Today" ? "animate-pulse" : ""
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-fg font-display">
                          {formatCalendarDate(event.date)}
                        </p>
                        <p
                          className={`text-[11px] font-mono ${
                            urgency === "Today"
                              ? "text-amber-400"
                              : urgency === "Tomorrow"
                              ? "text-sky-400"
                              : "text-fg-subtle"
                          }`}
                        >
                          {urgency}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border flex items-center gap-1 ${config.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          {event.type}
                        </span>
                        <span className="text-[11px] text-fg-subtle font-mono">
                          Owner: {event.owner}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-fg tracking-tight">
                        {event.title}
                      </h4>
                      <p className="text-xs text-fg-muted mt-1 font-sans font-light">
                        {event.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEdit(event)}
                      className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-3 py-2 text-xs font-mono text-fg-muted hover:text-fg hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label={`Edit ${event.title}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </GlassCard>
                </StaggerItem>
              </Fragment>
            );
          })}
        </StaggerGrid>
      )}

      <CalendarEventModal
        open={modalOpen}
        event={editingEvent}
        onClose={closeModal}
        onSave={onUpsert}
        onDelete={onDelete}
      />
    </div>
  );
}
