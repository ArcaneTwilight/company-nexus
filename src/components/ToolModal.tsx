import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ToolItem } from "../types";
import { CategorySelect } from "./CategorySelect";
import { getDefaultCategory, registerCustomCategory } from "../lib/categories";
import {
  ModalShell,
  fieldClass,
  labelClass,
} from "./modals";
import { GlassButton } from "./motion";

interface ToolModalProps {
  open: boolean;
  item?: ToolItem | null;
  existingCategories?: string[];
  onClose: () => void;
  onSave: (item: ToolItem) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface FormState {
  title: string;
  description: string;
  category: string;
  status: ToolItem["status"];
  url: string;
}

function blankForm(): FormState {
  return {
    title: "",
    description: "",
    category: getDefaultCategory("tools"),
    status: "Live",
    url: "",
  };
}

function fromItem(item: ToolItem): FormState {
  return {
    title: item.title,
    description: item.description,
    category: item.category,
    status: item.status,
    url: item.url,
  };
}

export function ToolModal({
  open,
  item = null,
  existingCategories = [],
  onClose,
  onSave,
  onDelete,
}: ToolModalProps) {
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
    const category = form.category.trim();
    const url = form.url.trim();
    if (!title || !category || !url) {
      setError("Title, category, and URL are required.");
      return;
    }

    registerCustomCategory("tools", category);
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: item?.id ?? `tool-${Date.now()}`,
        title,
        description: form.description.trim(),
        category,
        status: form.status,
        url,
        lastUpdated: new Date().toISOString().split("T")[0],
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
    if (!confirm(`Delete tool "${item.title}"?`)) return;

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
      title={isEditing ? "Edit tool" : "Add tool"}
      description="Direct access links to Company tools and web apps."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="tool-title" className={labelClass}>
            Title
          </label>
          <input
            id="tool-title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={fieldClass}
            required
            disabled={saving || deleting}
          />
        </div>

        <div>
          <label htmlFor="tool-desc" className={labelClass}>
            Description
          </label>
          <textarea
            id="tool-desc"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className={`${fieldClass} min-h-[72px] resize-y`}
            disabled={saving || deleting}
          />
        </div>

        <CategorySelect
          kind="tools"
          value={form.category}
          onChange={(category) => updateField("category", category)}
          extraCategories={extras}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="tool-status" className={labelClass}>
              Status
            </label>
            <select
              id="tool-status"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value as FormState["status"])}
              className={fieldClass}
              disabled={saving || deleting}
            >
              <option value="Live">Live</option>
              <option value="In Development">In Development</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div>
            <label htmlFor="tool-url" className={labelClass}>
              URL
            </label>
            <input
              id="tool-url"
              type="url"
              value={form.url}
              onChange={(e) => updateField("url", e.target.value)}
              className={fieldClass}
              placeholder="https://..."
              required
              disabled={saving || deleting}
            />
          </div>
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
              {deleting ? "Deleting…" : "Delete tool"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <GlassButton type="button" variant="ghost" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={saving || deleting}>
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add tool"}
            </GlassButton>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
