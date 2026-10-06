import { Check, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ModalActions,
  ModalShell,
  fieldClass,
  labelClass,
} from "../../components/modals/ModalShell";
import { GlassButton } from "../../components/motion";
import type { OtherReportItem } from "../../types";

interface OthersEditorModalProps {
  open: boolean;
  title: string;
  items: OtherReportItem[];
  onClose: () => void;
  onSave: (items: OtherReportItem[]) => void;
}

export function OthersEditorModal({
  open,
  title,
  items,
  onClose,
  onSave,
}: OthersEditorModalProps) {
  const [draft, setDraft] = useState<OtherReportItem[]>(items);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(items);
      setNewLabel("");
    }
  }, [open, items]);

  function addItem() {
    const label = newLabel.trim();
    if (!label) return;
    setDraft((prev) => [
      ...prev,
      {
        id: `other-${Date.now()}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        label,
        uploaded: false,
      },
    ]);
    setNewLabel("");
  }

  return (
    <ModalShell
      open={open}
      title={title}
      description="Add other report types and mark each as uploaded or missing."
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
          onClose();
        }}
      >
        <div className="space-y-3 px-5 py-4">
          {draft.length === 0 ? (
            <p className="text-sm text-fg-subtle">No other reports yet.</p>
          ) : (
            <ul className="space-y-2">
              {draft.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-panel-solid/40 px-2.5 py-2"
                >
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      item.uploaded
                        ? "font-bold text-emerald-600 dark:text-emerald-400"
                        : "font-medium text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {item.label}
                  </span>
                  <button
                    type="button"
                    title="Mark uploaded"
                    aria-label={`Mark ${item.label} uploaded`}
                    onClick={() =>
                      setDraft((prev) =>
                        prev.map((row) =>
                          row.id === item.id ? { ...row, uploaded: true } : row
                        )
                      )
                    }
                    className={`rounded-full p-1 ${
                      item.uploaded
                        ? "bg-emerald-500/20 text-emerald-600"
                        : "text-fg-subtle hover:bg-emerald-500/10 hover:text-emerald-600"
                    }`}
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    title="Mark missing"
                    aria-label={`Mark ${item.label} missing`}
                    onClick={() =>
                      setDraft((prev) =>
                        prev.map((row) =>
                          row.id === item.id ? { ...row, uploaded: false } : row
                        )
                      )
                    }
                    className={`rounded-full p-1 ${
                      !item.uploaded
                        ? "bg-rose-500/15 text-rose-500"
                        : "text-fg-subtle hover:bg-rose-500/10 hover:text-rose-500"
                    }`}
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    title="Remove"
                    aria-label={`Remove ${item.label}`}
                    onClick={() =>
                      setDraft((prev) => prev.filter((row) => row.id !== item.id))
                    }
                    className="rounded-full p-1 text-fg-subtle hover:bg-panel hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 pt-1">
            <div className="min-w-0 flex-1">
              <label className={labelClass} htmlFor="other-new-label">
                New report type
              </label>
              <input
                id="other-new-label"
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addItem();
                  }
                }}
                placeholder="e.g. PD, ESG, CGR"
                className={fieldClass}
              />
            </div>
            <GlassButton
              type="button"
              onClick={addItem}
              disabled={!newLabel.trim()}
              className="mt-5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add
            </GlassButton>
          </div>
        </div>

        <div className="border-t border-border px-5 py-3">
          <ModalActions onCancel={onClose} submitLabel="Save" />
        </div>
      </form>
    </ModalShell>
  );
}
