import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { TeamMember } from "../types";
import {
  COMMON_MEMBER_TIMEZONES,
  createTeamMemberId,
  labelForTimezoneId,
} from "../lib/teamDirectory";
import {
  ModalShell,
  fieldClass,
  labelClass,
} from "./modals";
import { GlassButton } from "./motion";
import { TeamCategoryCombobox } from "../features/team/TeamCategoryCombobox";

interface TeamMemberModalProps {
  open: boolean;
  member?: TeamMember | null;
  /** Existing team categories from the member list (new ones appear after save). */
  teamCategories: string[];
  onClose: () => void;
  onSave: (member: TeamMember) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface FormState {
  name: string;
  role: string;
  timezoneId: string;
  email: string;
  contactNotes: string;
}

function blankForm(): FormState {
  return {
    name: "",
    role: "",
    timezoneId: "Asia/Manila",
    email: "",
    contactNotes: "",
  };
}

function fromMember(member: TeamMember): FormState {
  return {
    name: member.name,
    role: member.role.trim().toLowerCase() === "pss" ? "App Support" : member.role,
    timezoneId: member.timezoneId || "Asia/Manila",
    email: member.email,
    contactNotes: member.contactNotes,
  };
}

export function TeamMemberModal({
  open,
  member = null,
  teamCategories,
  onClose,
  onSave,
  onDelete,
}: TeamMemberModalProps) {
  const isEditing = Boolean(member);
  const [form, setForm] = useState<FormState>(() => blankForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Categories known from the list, plus any newly typed value not yet saved. */
  const categories = useMemo(() => {
    const merged = new Set(teamCategories);
    const current = form.role.trim();
    if (current) merged.add(current);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [teamCategories, form.role]);

  useEffect(() => {
    if (!open) return;
    setForm(member ? fromMember(member) : blankForm());
    setError(null);
    setSaving(false);
    setDeleting(false);
  }, [open, member]);

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
    const role = form.role.trim();
    const email = form.email.trim();
    const contactNotes = form.contactNotes.trim();
    const timezoneId = form.timezoneId.trim();

    if (!name || !role || !email || !timezoneId || saving || deleting) {
      setError("Name, team, email, and timezone are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: TeamMember = {
      id: member?.id ?? createTeamMemberId(),
      name,
      role,
      timezoneId,
      timezone: labelForTimezoneId(timezoneId),
      email,
      contactNotes,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save member.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!member || !onDelete || saving || deleting) return;
    const confirmed = window.confirm(`Delete "${member.name}" from the team directory?`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await onDelete(member.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete member.");
      setDeleting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit team member" : "Add team member"}
      description="Members sync to Firebase and appear in the Team Directory."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="member-name" className={labelClass}>
            Name
          </label>
          <input
            id="member-name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={fieldClass}
            placeholder="e.g. Maria Santos"
            autoFocus
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="member-role" className={labelClass}>
              Team
            </label>
            <TeamCategoryCombobox
              id="member-role"
              value={form.role}
              categories={categories}
              onChange={(role) => updateField("role", role)}
              disabled={saving || deleting}
            />
            <p className="mt-1 text-[10px] text-fg-subtle">
              Pick an existing team or type a new one to add it.
            </p>
          </div>
          <div>
            <label htmlFor="member-timezone" className={labelClass}>
              Timezone
            </label>
            <select
              id="member-timezone"
              value={form.timezoneId}
              onChange={(e) => updateField("timezoneId", e.target.value)}
              className={fieldClass}
            >
              {(
                COMMON_MEMBER_TIMEZONES.some((tz) => tz.id === form.timezoneId)
                  ? COMMON_MEMBER_TIMEZONES
                  : [
                      { id: form.timezoneId, label: labelForTimezoneId(form.timezoneId) },
                      ...COMMON_MEMBER_TIMEZONES,
                    ]
              ).map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="member-email" className={labelClass}>
            Email
          </label>
          <input
            id="member-email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={fieldClass}
            placeholder="name@company.com"
            required
          />
        </div>

        <div>
          <label htmlFor="member-notes" className={labelClass}>
            Contact notes
          </label>
          <textarea
            id="member-notes"
            value={form.contactNotes}
            onChange={(e) => updateField("contactNotes", e.target.value)}
            className={`${fieldClass} min-h-[88px] resize-y`}
            placeholder="Availability, escalation notes, preferred contact hours"
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
              {deleting ? "Deleting…" : "Delete member"}
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
                !form.name.trim() ||
                !form.role.trim() ||
                !form.email.trim() ||
                !form.timezoneId.trim() ||
                saving ||
                deleting
              }
            >
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add member"}
            </GlassButton>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
