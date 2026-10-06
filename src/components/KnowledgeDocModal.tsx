import { useEffect, useState, type FormEvent } from "react";
import type { KnowledgeDoc, KnowledgeDomain } from "../types";
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

interface KnowledgeDocModalProps {
  open: boolean;
  item?: KnowledgeDoc | null;
  onClose: () => void;
  onSave: (item: KnowledgeDoc) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface FormState {
  title: string;
  domain: KnowledgeDomain;
  tags: string;
  body: string;
  summary: string;
  isArchived: boolean;
}

const DOMAINS: KnowledgeDomain[] = [
  "reports",
  "support",
  "developer",
  "clients",
  "team",
  "general",
];

function blankForm(): FormState {
  return {
    title: "",
    domain: "reports",
    tags: "",
    body: "",
    summary: "",
    isArchived: false,
  };
}

function fromItem(item: KnowledgeDoc): FormState {
  return {
    title: item.title,
    domain: item.domain,
    tags: item.tags.join(", "),
    body: item.body,
    summary: item.summary ?? "",
    isArchived: item.isArchived,
  };
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function KnowledgeDocModal({
  open,
  item = null,
  onClose,
  onSave,
  onDelete,
}: KnowledgeDocModalProps) {
  const isEditing = Boolean(item);
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const body = form.body.trim();
    if (!title || !body) {
      setError("Title and Markdown body are required.");
      return;
    }

    const derived = normalizeMarkdownKnowledgeFields(body, form.summary, title);
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: item?.id ?? `kdoc-${Date.now()}`,
        title,
        domain: form.domain,
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
    if (!confirm(`Permanently delete document "${item.title}"?`)) return;

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
      title={isEditing ? "Edit knowledge doc" : "Add knowledge doc"}
      description="Paste Markdown reports or long-form docs. Outlines and summaries are generated for AI retrieval."
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="kdoc-title" className={labelClass}>
            Title
          </label>
          <input
            id="kdoc-title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={fieldClass}
            required
            disabled={saving || deleting}
          />
        </div>

        <div>
          <label htmlFor="kdoc-domain" className={labelClass}>
            Domain
          </label>
          <select
            id="kdoc-domain"
            value={form.domain}
            onChange={(e) => updateField("domain", e.target.value as KnowledgeDomain)}
            className={fieldClass}
            disabled={saving || deleting}
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="kdoc-tags" className={labelClass}>
            Tags (comma-separated)
          </label>
          <input
            id="kdoc-tags"
            value={form.tags}
            onChange={(e) => updateField("tags", e.target.value)}
            className={fieldClass}
            placeholder="q1, earnings, mobile"
            disabled={saving || deleting}
          />
        </div>

        <div>
          <label htmlFor="kdoc-summary" className={labelClass}>
            Summary (optional — auto from body if empty)
          </label>
          <input
            id="kdoc-summary"
            value={form.summary}
            onChange={(e) => updateField("summary", e.target.value)}
            className={fieldClass}
            disabled={saving || deleting}
          />
        </div>

        <div>
          <label htmlFor="kdoc-body" className={labelClass}>
            Markdown body
          </label>
          <textarea
            id="kdoc-body"
            value={form.body}
            onChange={(e) => updateField("body", e.target.value)}
            className={`${fieldClass} min-h-[220px] font-mono text-[12px]`}
            required
            disabled={saving || deleting}
            placeholder={"# Report title\n\n## Section\n\nPaste Markdown here…"}
          />
          {findOversizedSections(form.body).length > 0 && (
            <p className="mt-1.5 text-[11px] text-amber-700/90 dark:text-amber-300/90">
              One or more sections look long for AI retrieval. Split with H2 headings so AIRA
              can load a single section instead of the full document.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-[13px] text-fg-muted">
          <input
            type="checkbox"
            checked={form.isArchived}
            onChange={(e) => updateField("isArchived", e.target.checked)}
            disabled={saving || deleting}
          />
          Archived (hidden from AI registry)
        </label>

        {error && <p className="text-[12px] text-rose-400">{error}</p>}

        <div className="flex flex-wrap gap-2 justify-end pt-2">
          {isEditing && onDelete && (
            <GlassButton
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </GlassButton>
          )}
          <GlassButton type="button" variant="ghost" onClick={onClose} disabled={saving || deleting}>
            Cancel
          </GlassButton>
          <GlassButton type="submit" variant="primary" disabled={saving || deleting}>
            {saving ? "Saving…" : "Save"}
          </GlassButton>
        </div>
      </form>
    </ModalShell>
  );
}
