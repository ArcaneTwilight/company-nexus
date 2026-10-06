import { useEffect, useState, type FormEvent } from "react";
import type { CalendarEvent, CalendarEventType } from "../types";
import {
  CALENDAR_EVENT_TYPES,
  createCalendarEventId,
  todayISO,
} from "../lib/calendar";
import {
  ModalShell,
  fieldClass,
  labelClass,
} from "./modals";
import { GlassButton } from "./motion";

interface CalendarEventModalProps {
  open: boolean;
  event?: CalendarEvent | null;
  onClose: () => void;
  onSave: (event: CalendarEvent) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface FormState {
  title: string;
  date: string;
  type: CalendarEventType;
  description: string;
  owner: string;
}

function blankForm(): FormState {
  return {
    title: "",
    date: todayISO(),
    type: "Event",
    description: "",
    owner: "",
  };
}

function fromEvent(event: CalendarEvent): FormState {
  return {
    title: event.title,
    date: event.date,
    type: event.type,
    description: event.description,
    owner: event.owner,
  };
}

export function CalendarEventModal({
  open,
  event = null,
  onClose,
  onSave,
  onDelete,
}: CalendarEventModalProps) {
  const isEditing = Boolean(event);
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(event ? fromEvent(event) : blankForm());
    setError(null);
    setSaving(false);
    setDeleting(false);
  }, [open, event]);

  function handleClose() {
    if (saving || deleting) return;
    onClose();
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    const title = form.title.trim();
    const owner = form.owner.trim();
    const description = form.description.trim();

    if (!title || !form.date || !owner || saving || deleting) {
      setError("Title, date, and owner are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: CalendarEvent = {
      id: event?.id ?? createCalendarEventId(),
      title,
      date: form.date,
      type: form.type,
      description,
      owner,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event || !onDelete || saving || deleting) return;
    const confirmed = window.confirm(`Delete "${event.title}"?`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await onDelete(event.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
      setDeleting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit calendar event" : "Add calendar event"}
      description="Events sync to Firebase and appear on Overview and Team Calendar."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cal-title" className={labelClass}>
            Title
          </label>
          <input
            id="cal-title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={fieldClass}
            placeholder="e.g. Sprint planning"
            autoFocus
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="cal-date" className={labelClass}>
              Date
            </label>
            <input
              id="cal-date"
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className={fieldClass}
              required
            />
          </div>
          <div>
            <label htmlFor="cal-type" className={labelClass}>
              Category
            </label>
            <select
              id="cal-type"
              value={form.type}
              onChange={(e) => updateField("type", e.target.value as CalendarEventType)}
              className={fieldClass}
            >
              {CALENDAR_EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="cal-owner" className={labelClass}>
            Owner
          </label>
          <input
            id="cal-owner"
            value={form.owner}
            onChange={(e) => updateField("owner", e.target.value)}
            className={fieldClass}
            placeholder="e.g. Sarah Chen"
            required
          />
        </div>

        <div>
          <label htmlFor="cal-description" className={labelClass}>
            Description
          </label>
          <textarea
            id="cal-description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className={`${fieldClass} min-h-[88px] resize-y`}
            placeholder="Optional details for the team"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="text-xs font-mono text-rose-400 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete event"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <GlassButton type="button" variant="ghost" onClick={handleClose} disabled={saving || deleting}>
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              disabled={
                !form.title.trim() || !form.date || !form.owner.trim() || saving || deleting
              }
            >
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add event"}
            </GlassButton>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
