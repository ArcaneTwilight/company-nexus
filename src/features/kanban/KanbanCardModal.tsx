import { useState, useEffect } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { ModalShell, fieldClass, labelClass, ModalActions } from "../../components/modals/ModalShell";
import { GlassButton } from "../../components/motion";
import type { KanbanCard } from "../../types";

interface KanbanCardModalProps {
  open: boolean;
  card: KanbanCard | null;
  boardId: string;
  columnId: string;
  showActions?: boolean;
  onClose: () => void;
  onSave: (card: KanbanCard) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function KanbanCardModal({
  open,
  card,
  boardId,
  columnId,
  showActions = false,
  onClose,
  onSave,
  onDelete,
  onArchive,
}: KanbanCardModalProps) {
  const [title, setTitle] = useState("");
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTitle(card?.title ?? "");
      setActions(card?.actions ?? []);
    }
  }, [open, card]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    onSave({
      id: card?.id ?? `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      boardId,
      columnId: card?.columnId ?? columnId,
      title: title.trim(),
      actions: showActions ? actions.filter((a) => a.trim()) : undefined,
      position: card?.position ?? Date.now(),
      archived: card?.archived ?? false,
      createdAt: card?.createdAt ?? now,
      updatedAt: now,
    });
    onClose();
  }

  function addAction() {
    setActions((prev) => [...prev, ""]);
  }

  function updateAction(index: number, value: string) {
    setActions((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  function removeAction(index: number) {
    setActions((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <ModalShell open={open} title={card ? "Edit Card" : "Add Card"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            autoFocus
          />
        </div>

        {showActions && (
          <div>
            <label className={labelClass}>Action Items</label>
            <div className="space-y-2">
              {actions.map((action, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={fieldClass}
                    value={action}
                    onChange={(e) => updateAction(i, e.target.value)}
                    placeholder="Action info"
                  />
                  <button
                    type="button"
                    onClick={() => removeAction(i)}
                    className="shrink-0 rounded-lg p-1.5 text-fg-muted hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAction}
                className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add action
              </button>
            </div>
          </div>
        )}

        {card && (
          <div className="flex items-center gap-2 pt-1">
            {onArchive && !card.archived && (
              <GlassButton
                type="button"
                variant="ghost"
                onClick={() => {
                  onArchive(card.id);
                  onClose();
                }}
              >
                Archive
              </GlassButton>
            )}
            {onDelete && (
              <GlassButton
                type="button"
                variant="ghost"
                onClick={() => {
                  onDelete(card.id);
                  onClose();
                }}
                className="!text-red-400 hover:!text-red-300"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </GlassButton>
            )}
          </div>
        )}

        <ModalActions
          onCancel={onClose}
          submitLabel={card ? "Save" : "Add Card"}
          disabled={!title.trim()}
        />
      </form>
    </ModalShell>
  );
}
