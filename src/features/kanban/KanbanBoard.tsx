import { useRef, useCallback } from "react";
import { KanbanColumn } from "./KanbanColumn";
import type { KanbanBoard as KanbanBoardType, KanbanCard, KanbanColumn as KanbanColumnType } from "../../types";

interface KanbanBoardProps {
  board: KanbanBoardType;
  cards: KanbanCard[];
  fullWidth?: boolean;
  onEditCard: (card: KanbanCard) => void;
  onAddCard: (columnId: string) => void;
  onQuickAdd: (columnId: string, title: string) => void;
  onMoveCard: (card: KanbanCard, toColumnId: string) => void;
  onViewArchived: (columnId?: string) => void;
}

export function KanbanBoard({
  board,
  cards,
  fullWidth,
  onEditCard,
  onAddCard,
  onQuickAdd,
  onMoveCard,
  onViewArchived,
}: KanbanBoardProps) {
  const draggedCardRef = useRef<KanbanCard | null>(null);
  const isDevelopmentBoard = board.id === "board-irapp-dev";

  function handleDragStart(_e: React.DragEvent, card: KanbanCard) {
    draggedCardRef.current = card;
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  const handleDrop = useCallback(
    (_e: React.DragEvent, columnId: string) => {
      const card = draggedCardRef.current;
      if (!card || card.columnId === columnId) {
        draggedCardRef.current = null;
        return;
      }
      onMoveCard(card, columnId);
      draggedCardRef.current = null;
    },
    [onMoveCard]
  );

  function getColumnCards(col: KanbanColumnType) {
    return cards
      .filter((c) => c.columnId === col.id && !c.archived)
      .sort((a, b) => a.position - b.position);
  }

  function getArchivedCount(col: KanbanColumnType) {
    return cards.filter((c) => c.columnId === col.id && c.archived).length;
  }

  return (
    <div className={`flex gap-4 pb-4 pt-1 px-1 ${fullWidth ? "" : "overflow-x-auto"}`}>
      {board.columns.map((col) => (
        <KanbanColumn
          key={col.id}
          column={col}
          cards={getColumnCards(col)}
          archivedCount={getArchivedCount(col)}
          showCardActions={isDevelopmentBoard}
          fullWidth={fullWidth}
          onEditCard={onEditCard}
          onAddCard={onAddCard}
          onQuickAdd={onQuickAdd}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onViewArchived={() => onViewArchived(col.id)}
        />
      ))}
    </div>
  );
}
