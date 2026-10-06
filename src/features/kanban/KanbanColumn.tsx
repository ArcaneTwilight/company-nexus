import { useState, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { Plus, Archive } from "lucide-react";
import { KanbanCard } from "./KanbanCard";
import type { KanbanCard as KanbanCardType, KanbanColumn as KanbanColumnType } from "../../types";

interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: KanbanCardType[];
  archivedCount: number;
  showCardActions?: boolean;
  fullWidth?: boolean;
  onEditCard: (card: KanbanCardType) => void;
  onAddCard: (columnId: string) => void;
  onQuickAdd: (columnId: string, title: string) => void;
  onDragStart: (e: React.DragEvent, card: KanbanCardType) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onViewArchived: () => void;
}

export function KanbanColumn({
  column,
  cards,
  archivedCount,
  showCardActions = false,
  fullWidth = false,
  onEditCard,
  onAddCard,
  onQuickAdd,
  onDragStart,
  onDragOver,
  onDrop,
  onViewArchived,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleCards = column.maxVisible
    ? cards.slice(0, column.maxVisible)
    : cards;
  const hiddenCount = cards.length - visibleCards.length;

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsOver(true);
    onDragOver(e);
  }

  function handleDragLeave() {
    setIsOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsOver(false);
    onDrop(e, column.id);
  }

  function handleQuickAddSubmit() {
    const trimmed = quickAddValue.trim();
    if (trimmed) {
      onQuickAdd(column.id, trimmed);
      setQuickAddValue("");
    }
    setIsQuickAdding(false);
  }

  function handleQuickAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickAddSubmit();
    }
    if (e.key === "Escape") {
      setQuickAddValue("");
      setIsQuickAdding(false);
    }
  }

  const columnColors: Record<string, string> = {
    "On Hold": "bg-amber-500/20 text-amber-800 dark:text-amber-300",
    "Planned": "bg-sky-500/20 text-sky-800 dark:text-sky-300",
    "Ongoing": "bg-violet-500/20 text-violet-800 dark:text-violet-300",
    "Complete": "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300",
    "To Do": "bg-slate-500/20 text-slate-800 dark:text-slate-300",
    "In Progress": "bg-sky-500/20 text-sky-800 dark:text-sky-300",
    "Done": "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300",
  };

  const badgeColor = columnColors[column.title] ?? "bg-fg-subtle/20 text-fg-muted";

  return (
    <div
      className={`flex flex-col rounded-2xl border transition-colors ${
        fullWidth ? "flex-1 min-w-0" : "min-w-[272px] w-[272px]"
      } ${
        isOver
          ? "border-sky-500/40 bg-sky-500/5"
          : "border-border bg-panel/50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {column.title}
          </span>
          <span className="text-xs text-fg-subtle">{cards.length}</span>
        </div>
        <button
          type="button"
          onClick={() => onAddCard(column.id)}
          className="rounded-lg p-1 text-fg-subtle hover:text-fg hover:bg-panel transition-colors"
          title="Add card"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto max-h-[calc(100vh-320px)]">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              showActions={showCardActions}
              onEdit={onEditCard}
              onDragStart={onDragStart}
            />
          ))}
        </AnimatePresence>

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={onViewArchived}
            className="w-full text-center py-2 text-xs text-fg-muted hover:text-fg transition-colors"
          >
            +{hiddenCount} more card{hiddenCount > 1 ? "s" : ""}
          </button>
        )}

        {isQuickAdding ? (
          <input
            ref={inputRef}
            className="w-full rounded-xl border border-border bg-panel-solid px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-sky-500/40"
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            onBlur={handleQuickAddSubmit}
            onKeyDown={handleQuickAddKeyDown}
            placeholder="Card title…"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsQuickAdding(true)}
            className="w-full flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-fg-muted hover:text-fg hover:bg-panel transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add a card
          </button>
        )}
      </div>

      {(column.autoArchive || archivedCount > 0) && archivedCount > 0 && (
        <div className="border-t border-border px-4 py-2">
          <button
            type="button"
            onClick={onViewArchived}
            className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            {archivedCount} archived
          </button>
        </div>
      )}
    </div>
  );
}
