import { useState } from "react";
import { Plus, X } from "lucide-react";
import { ModalShell, fieldClass, labelClass, ModalActions } from "../../components/modals/ModalShell";

interface AddBoardModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, columns: string[]) => void;
}

export function AddBoardModal({ open, onClose, onSave }: AddBoardModalProps) {
  const [name, setName] = useState("");
  const [columns, setColumns] = useState(["To Do", "In Progress", "Done"]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validCols = columns.filter((c) => c.trim());
    if (!name.trim() || validCols.length < 2) return;
    onSave(name.trim(), validCols.map((c) => c.trim()));
    setName("");
    setColumns(["To Do", "In Progress", "Done"]);
    onClose();
  }

  function updateColumn(index: number, value: string) {
    setColumns((prev) => prev.map((c, i) => (i === index ? value : c)));
  }

  function removeColumn(index: number) {
    if (columns.length <= 2) return;
    setColumns((prev) => prev.filter((_, i) => i !== index));
  }

  function addColumn() {
    setColumns((prev) => [...prev, ""]);
  }

  return (
    <ModalShell open={open} title="New Board" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Board Name</label>
          <input
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sprint Board"
            autoFocus
          />
        </div>

        <div>
          <label className={labelClass}>Columns (min 2)</label>
          <div className="space-y-2">
            {columns.map((col, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={fieldClass}
                  value={col}
                  onChange={(e) => updateColumn(i, e.target.value)}
                  placeholder={`Column ${i + 1}`}
                />
                {columns.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeColumn(i)}
                    className="shrink-0 rounded-lg p-1.5 text-fg-muted hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addColumn}
              className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add column
            </button>
          </div>
        </div>

        <ModalActions
          onCancel={onClose}
          submitLabel="Create Board"
          disabled={!name.trim() || columns.filter((c) => c.trim()).length < 2}
        />
      </form>
    </ModalShell>
  );
}
