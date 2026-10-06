import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { KBItem } from "../types";
import { CategorySelect } from "./CategorySelect";
import { getDefaultCategory, registerCustomCategory } from "../lib/categories";
import {
  findOversizedSections,
  normalizeMarkdownKnowledgeFields,
} from "../lib/knowledgeMarkdown";
import {
  ModalShell,
  fieldClass,
  labelClass,
} from "./modals";
import { GlassButton } from "./motion";

interface KbArticleModalProps {
  open: boolean;
  item?: KBItem | null;
  existingCategories?: string[];
  onClose: () => void;
  onSave: (item: KBItem) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface FormState {
  title: string;
  category: string;
  tags: string;
  body: string;
  isArchived: boolean;
}

function blankForm(): FormState {
  return {
    title: "",
    category: getDefaultCategory("kb"),
    tags: "",
    body: "",
    isArchived: false,
  };
}

function fromItem(item: KBItem): FormState {
  return {
    title: item.title,
    category: item.category,
    tags: item.tags.join(", "),
    body: item.body,
    isArchived: item.isArchived,
  };
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function KbArticleModal({
  open,
  item = null,
  existingCategories = [],
  onClose,
  onSave,
  onDelete,
}: KbArticleModalProps) {
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
    const body = form.body.trim();
    if (!title || !category || !body) {
      setError("Title, category, and body are required.");
      return;
    }

    registerCustomCategory("kb", category);
    const derived = normalizeMarkdownKnowledgeFields(body, undefined, title);
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: item?.id ?? `kb-${Date.now()}`,
        title,
        category,
        tags: parseTags(form.tags),
        body,
        summary: derived.summary,
        outline: derived.outline,
        tokenEstimate: derived.tokenEstimate,
        contentVersion: (item?.contentVersion ?? 0) + 1,
        lastUpdated: new Date().toISOString().split("T")[0],
        isArchived: form.isArchived,
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
    if (!confirm(`Permanently delete article "${item.title}"?`)) return;

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
      title={isEditing ? "Edit article" : "Add article"}
      description="Engineering guides and architecture notes (Markdown supported)."
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="kb-title" className={labelClass}>
            Title
          </label>
          <input
            id="kb-title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={fieldClass}
            required
            disabled={saving || deleting}
          />
        </div>

        <CategorySelect
          kind="kb"
          value={form.category}
          onChange={(category) => updateField("category", category)}
          extraCategories={extras}
        />

        <div>
          <label htmlFor="kb-tags" className={labelClass}>
            Tags (comma-separated)
          </label>
          <input
            id="kb-tags"
            value={form.tags}
            onChange={(e) => updateField("tags", e.target.value)}
            className={fieldClass}
            placeholder="ios, release, deeplink"
            disabled={saving || deleting}
          />
        </div>

        <div>
          <label htmlFor="kb-body" className={labelClass}>
            Body (Markdown)
          </label>
          <textarea
            id="kb-body"
            value={form.body}
            onChange={(e) => updateField("body", e.target.value)}
            className={`${fieldClass} min-h-[180px] resize-y font-mono text-xs`}
            required
            disabled={saving || deleting}
          />
          {findOversizedSections(form.body).length > 0 && (
            <p className="mt-1.5 text-[11px] text-amber-700/90 dark:text-amber-300/90">
              Some sections are long for AI retrieval. Prefer H2 headings and shorter sections
              so AIRA can load only what it needs.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer">
          <input
            type="checkbox"
            checked={form.isArchived}
            onChange={(e) => updateField("isArchived", e.target.checked)}
            className="rounded border-border-strong bg-panel-solid"
            disabled={saving || deleting}
          />
          Archived (hidden from browse)
        </label>

        {error && (
          <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="text-xs font-mono text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete article"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <GlassButton type="button" variant="ghost" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={saving || deleting}>
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add article"}
            </GlassButton>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
