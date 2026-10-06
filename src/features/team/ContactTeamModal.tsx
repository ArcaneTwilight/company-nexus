import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ContactTeam } from "../../types";
import { ModalShell, fieldClass, labelClass } from "../../components/modals";
import { GlassButton } from "../../components/motion";
import { TeamCategoryCombobox } from "./TeamCategoryCombobox";

const SEED_CONTACT_TEAM_CATEGORIES = [
  "Content",
  "Operations",
  "Client",
  "Engineering",
  "Support",
] as const;

interface ContactTeamModalProps {
  open: boolean;
  team?: ContactTeam | null;
  categories: string[];
  onClose: () => void;
  onSave: (team: ContactTeam) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface FormState {
  name: string;
  category: string;
  email: string;
  groupChat: string;
  notes: string;
}

function createContactTeamId(): string {
  return `cteam-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function blankForm(defaultCategory: string): FormState {
  return {
    name: "",
    category: defaultCategory,
    email: "",
    groupChat: "",
    notes: "",
  };
}

function fromTeam(team: ContactTeam): FormState {
  return {
    name: team.name,
    category: team.category,
    email: team.email,
    groupChat: team.groupChat,
    notes: team.notes,
  };
}

export function ContactTeamModal({
  open,
  team = null,
  categories,
  onClose,
  onSave,
  onDelete,
}: ContactTeamModalProps) {
  const isEditing = Boolean(team);
  const defaultCategory = categories[0] ?? SEED_CONTACT_TEAM_CATEGORIES[0];
  const [form, setForm] = useState<FormState>(() => blankForm(defaultCategory));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(() => {
    const merged = new Set<string>([...SEED_CONTACT_TEAM_CATEGORIES, ...categories]);
    const current = form.category.trim();
    if (current) merged.add(current);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [categories, form.category]);

  useEffect(() => {
    if (!open) return;
    setForm(team ? fromTeam(team) : blankForm(defaultCategory));
    setError(null);
    setSaving(false);
    setDeleting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- categories used for create default only
  }, [open, team]);

  function handleClose() {
    if (saving || deleting) return;
    onClose();
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    const name = form.name.trim();
    const category = form.category.trim();
    const email = form.email.trim();
    const groupChat = form.groupChat.trim();
    const notes = form.notes.trim();

    if (!name || !category || saving || deleting) {
      setError("Name and category are required.");
      return;
    }
    if (!email && !groupChat) {
      setError("Add a team email or group chat so others know how to reach them.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: ContactTeam = {
      id: team?.id ?? createContactTeamId(),
      name,
      category,
      email,
      groupChat,
      notes,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save team.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!team || !onDelete || saving || deleting) return;
    const confirmed = window.confirm(`Delete team "${team.name}" from the directory?`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await onDelete(team.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete team.");
      setDeleting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit team" : "Add team"}
      description="Partner teams outside Company — email, group chat, and ownership notes for quick reference."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact-team-name" className={labelClass}>
            Team name
          </label>
          <input
            id="contact-team-name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={fieldClass}
            placeholder="e.g. Company Announcements"
            autoFocus
            required
            disabled={saving || deleting}
          />
        </div>

        <div>
          <label htmlFor="contact-team-category" className={labelClass}>
            Category
          </label>
          <TeamCategoryCombobox
            id="contact-team-category"
            value={form.category}
            categories={categoryOptions}
            onChange={(category) => updateField("category", category)}
            disabled={saving || deleting}
          />
          <p className="mt-1 text-[10px] text-fg-subtle">
            Pick an existing category or type a new one.
          </p>
        </div>

        <div>
          <label htmlFor="contact-team-email" className={labelClass}>
            Main email
          </label>
          <input
            id="contact-team-email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={fieldClass}
            placeholder="team@company.com"
            disabled={saving || deleting}
          />
        </div>

        <div>
          <label htmlFor="contact-team-chat" className={labelClass}>
            Group chat
          </label>
          <input
            id="contact-team-chat"
            value={form.groupChat}
            onChange={(e) => updateField("groupChat", e.target.value)}
            className={fieldClass}
            placeholder="Slack / Teams URL or channel name"
            disabled={saving || deleting}
          />
        </div>

        <div>
          <label htmlFor="contact-team-notes" className={labelClass}>
            Ownership notes
          </label>
          <textarea
            id="contact-team-notes"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className={`${fieldClass} min-h-[96px] resize-y`}
            placeholder='e.g. This team handles the Company Announcement content'
            disabled={saving || deleting}
          />
          <p className="mt-1 text-[10px] text-fg-subtle">
            Describe what they own so people and AI know who to approach.
          </p>
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
              {deleting ? "Deleting…" : "Delete team"}
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
              disabled={!form.name.trim() || !form.category.trim() || saving || deleting}
            >
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add team"}
            </GlassButton>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
