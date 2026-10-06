import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { QuickLink } from "../types";
import { CategorySelect } from "./CategorySelect";
import { getDefaultCategory, registerCustomCategory } from "../lib/categories";
import {
  ModalShell,
  fieldClass,
  labelClass,
} from "./modals";
import { GlassButton } from "./motion";

interface LinkModalProps {
  open: boolean;
  item?: QuickLink | null;
  existingCategories?: string[];
  onClose: () => void;
  onSave: (item: QuickLink) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface FormState {
  title: string;
  url: string;
  category: string;
  notes: string;
}

function blankForm(): FormState {
  return {
    title: "",
    url: "",
    category: getDefaultCategory("links"),
    notes: "",
  };
}

function fromItem(item: QuickLink): FormState {
  return {
    title: item.title,
    url: item.url,
    category: item.category,
    notes: item.notes ?? "",
  };
}

export function LinkModal({
  open,
  item = null,
  existingCategories = [],
  onClose,
  onSave,
  onDelete,
}: LinkModalProps) {
  const isEditing = Boolean(item);
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const extras = useMemo(() => existingCategories, [existingCategories]);

  useEffect(() => {
    if (!open) return;
    setForm(item ? fromItem(item) : blankForm());
    setError(null);
    setSaving(false);
    setDeleting(false);
  }, [open, item]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving || deleting) return;

    const title = form.title.trim();
    const url = form.url.trim();
    const category = form.category.trim();
    if (!title || !url || !category) {
      setError("Title, URL, and category are required.");
      return;
    }

    registerCustomCategory("links", category);
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: item?.id ?? `link-${Date.now()}`,
        title,
        url,
        category,
        notes: form.notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Save failed. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!item || !onDelete || saving || deleting) return;
    if (!confirm(`Remove bookmark "${item.title}"?`)) return;

    setDeleting(true);
    setError(null);
    try {
      await onDelete(item.id);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Delete failed. Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      title={isEditing ? "Edit bookmark" : "Add bookmark"}
      description="Operational bookmarks for team platforms."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="link-title" className={labelClass}>
            Title
          </label>
          <input
            id="link-title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={fieldClass}
            required
            disabled={saving || deleting}
          />
        </div>

        <div>
          <label htmlFor="link-url" className={labelClass}>
            URL
          </label>
          <input
            id="link-url"
            type="url"
            value={form.url}
            onChange={(e) => updateField("url", e.target.value)}
            className={fieldClass}
            placeholder="https://..."
            required
            disabled={saving || deleting}
          />
        </div>

        <CategorySelect
          kind="links"
          value={form.category}
          onChange={(category) => updateField("category", category)}
          extraCategories={extras}
        />

        <div>
          <label htmlFor="link-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="link-notes"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className={`${fieldClass} min-h-[72px] resize-y`}
            placeholder="Optional context"
            disabled={saving || deleting}
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
              {deleting ? "Deleting…" : "Delete bookmark"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <GlassButton type="button" variant="ghost" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={saving || deleting}>
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add bookmark"}
            </GlassButton>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
