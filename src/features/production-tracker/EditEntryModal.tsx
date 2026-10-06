import { useEffect, useState } from "react";
import { Link2, Link2Off } from "lucide-react";
import {
  ModalActions,
  ModalShell,
  fieldClass,
  labelClass,
} from "../../components/modals/ModalShell";
import type { companymasterapp, ProductionTrackerEntry } from "../../types";
import { PHASE_OPTIONS, PRIORITY_OPTIONS } from "./constants";

interface EditEntryModalProps {
  open: boolean;
  entry: ProductionTrackerEntry | null;
  linkedApp?: companymasterapp;
  onClose: () => void;
  onSave: (patch: {
    clientName: string;
    priority: string;
    assignedDev: string;
    assignedPss: string;
    currentPhase: string;
    comments: string;
  }) => void;
}

export function EditEntryModal({
  open,
  entry,
  linkedApp,
  onClose,
  onSave,
}: EditEntryModalProps) {
  const [clientName, setClientName] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedDev, setAssignedDev] = useState("");
  const [assignedPss, setAssignedPss] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (!open || !entry) return;
    setClientName(entry.clientName);
    setPriority(entry.priority);
    setAssignedDev(entry.assignedDev);
    setAssignedPss(entry.assignedPss);
    setCurrentPhase(entry.currentPhase);
    setComments(entry.comments ?? "");
  }, [open, entry]);

  if (!entry) return null;

  const priorityChoices = PRIORITY_OPTIONS.includes(
    priority as (typeof PRIORITY_OPTIONS)[number]
  )
    ? PRIORITY_OPTIONS
    : ([priority, ...PRIORITY_OPTIONS] as string[]);

  const phaseChoices = PHASE_OPTIONS.includes(
    currentPhase as (typeof PHASE_OPTIONS)[number]
  )
    ? PHASE_OPTIONS
    : ([currentPhase, ...PHASE_OPTIONS] as string[]);

  return (
    <ModalShell
      open={open}
      title="Edit production entry"
      description="Update priority, owners, and current phase for standup tracking."
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!clientName.trim()) return;
          onSave({
            clientName: clientName.trim(),
            priority: priority.trim(),
            assignedDev: assignedDev.trim(),
            assignedPss: assignedPss.trim(),
            currentPhase: currentPhase.trim(),
            comments: comments.trim(),
          });
          onClose();
        }}
      >
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-lg border border-border bg-panel-solid/50 px-3 py-2.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
              Linked Company client
            </p>
            {linkedApp ? (
              <p className="mt-1 flex items-center gap-2 text-sm text-fg">
                <Link2 className="h-4 w-4 shrink-0 text-sky-500" />
                <span className="min-w-0 truncate">{linkedApp.companyName}</span>
              </p>
            ) : (
              <p className="mt-1 flex items-center gap-2 text-sm text-fg-subtle">
                <Link2Off className="h-4 w-4 shrink-0 opacity-60" />
                Not linked to an Company client
              </p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="pt-client-name">
              Client
            </label>
            <input
              id="pt-client-name"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              className={fieldClass}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="pt-priority">
                Priority
              </label>
              <select
                id="pt-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className={fieldClass}
              >
                {priorityChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="pt-phase">
                Current Phase
              </label>
              <select
                id="pt-phase"
                value={currentPhase}
                onChange={(event) => setCurrentPhase(event.target.value)}
                className={fieldClass}
              >
                {phaseChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="pt-dev">
                Assigned Dev
              </label>
              <input
                id="pt-dev"
                value={assignedDev}
                onChange={(event) => setAssignedDev(event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="pt-pss">
                Assigned App Support
              </label>
              <input
                id="pt-pss"
                value={assignedPss}
                onChange={(event) => setAssignedPss(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="pt-comments">
              Comments
            </label>
            <textarea
              id="pt-comments"
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              className={`${fieldClass} min-h-[72px] resize-y`}
              rows={3}
            />
          </div>
        </div>
        <div className="border-t border-border px-5 py-3">
          <ModalActions
            onCancel={onClose}
            submitLabel="Save"
            disabled={!clientName.trim()}
          />
        </div>
      </form>
    </ModalShell>
  );
}
