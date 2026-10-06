import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { MetricItem } from "../types";
import { CategorySelect } from "./CategorySelect";
import { getDefaultCategory, registerCustomCategory } from "../lib/categories";
import {
  ModalShell,
  fieldClass,
  labelClass,
} from "./modals";
import { GlassButton } from "./motion";

interface MetricModalProps {
  open: boolean;
  item?: MetricItem | null;
  existingCategories?: string[];
  onClose: () => void;
  onSave: (item: MetricItem) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface FormState {
  title: string;
  value: string;
  category: string;
}

function blankForm(): FormState {
  return {
    title: "",
    value: "",
    category: getDefaultCategory("metrics"),
  };
}

function fromItem(item: MetricItem): FormState {
  return {
    title: item.title,
    value: item.value,
    category: item.category,
  };
}

export function MetricModal({
  open,
  item = null,
  existingCategories = [],
  onClose,
  onSave,
  onDelete,
}: MetricModalProps) {
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
    const value = form.value.trim();
    const category = form.category.trim();
    if (!title || !value || !category) {
      setError("Title, value, and category are required.");
      return;
    }

    registerCustomCategory("metrics", category);
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: item?.id ?? `metric-${Date.now()}`,
        title,
        value,
        category,
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
    if (!confirm(`Delete metric "${item.title}"?`)) return;

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
      title={isEditing ? "Edit metric" : "Add metric"}
      description="Overview KPI cards shown on the dashboard."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="metric-title" className={labelClass}>
            Title
          </label>
          <input
            id="metric-title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={fieldClass}
            required
            disabled={saving || deleting}
          />
        </div>

        <div>
          <label htmlFor="metric-value" className={labelClass}>
            Value
          </label>
          <input
            id="metric-value"
            value={form.value}
            onChange={(e) => updateField("value", e.target.value)}
            className={fieldClass}
            placeholder="128 or 98.5%"
            required
            disabled={saving || deleting}
          />
        </div>

        <CategorySelect
          kind="metrics"
          value={form.category}
          onChange={(category) => updateField("category", category)}
          extraCategories={extras}
        />

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
              {deleting ? "Deleting…" : "Delete metric"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <GlassButton type="button" variant="ghost" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={saving || deleting}>
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add metric"}
            </GlassButton>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
