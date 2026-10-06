import { useState } from "react";
import { GripVertical, Pencil } from "lucide-react";
import type { KanbanCard as KanbanCardType } from "../../types";

interface KanbanCardProps {
  card: KanbanCardType;
  showActions?: boolean;
  onEdit: (card: KanbanCardType) => void;
  onDragStart: (e: React.DragEvent, card: KanbanCardType) => void;
}

export function KanbanCard({ card, showActions = false, onEdit, onDragStart }: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    setIsDragging(true);
    onDragStart(e, card);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      className={`group relative cursor-grab active:cursor-grabbing rounded-xl border border-border bg-panel hover:border-border-strong transition-colors ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2 px-3 py-3">
        <GripVertical className="w-4 h-4 mt-0.5 shrink-0 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-fg leading-snug">{card.title}</p>
          {showActions && card.actions && card.actions.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {card.actions.map((action, i) => (
                <li key={i} className="text-xs text-fg-muted leading-relaxed flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-fg-subtle shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => onEdit(card)}
          className="shrink-0 rounded-lg p-1 text-fg-subtle opacity-0 group-hover:opacity-100 hover:text-fg transition-all"
          title="Edit card"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
