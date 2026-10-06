import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { KanbanBoard } from "./KanbanBoard";
import { KanbanCardModal } from "./KanbanCardModal";
import { ArchivedCardsModal } from "./ArchivedCardsModal";
import { AddBoardModal } from "./AddBoardModal";
import { DEFAULT_BOARDS, SAMPLE_CARD } from "./kanbanDefaults";
import { GlassButton } from "../../components/motion";
import type {
  KanbanBoard as KanbanBoardType,
  KanbanCard as KanbanCardType,
  KanbanColumn,
} from "../../types";
import type { NexusRepositoryActions } from "../../services/nexusRepository";

interface KanbanSectionProps {
  boards: KanbanBoardType[];
  cards: KanbanCardType[];
  actions: NexusRepositoryActions;
}

export function KanbanSection({ boards, cards, actions }: KanbanSectionProps) {
  const [activeBoardId, setActiveBoardId] = useState<string>("board-irapp-dev");
  const [editCard, setEditCard] = useState<KanbanCardType | null>(null);
  const [addColumnId, setAddColumnId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState<string | null>(null);
  const [showAddBoard, setShowAddBoard] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current || boards.length > 0) return;
    seededRef.current = true;
    DEFAULT_BOARDS.forEach((b) => actions.upsertKanbanBoard(b));
    actions.upsertKanbanCard(SAMPLE_CARD);
  }, [boards.length, actions]);

  const effectiveBoards = boards.length > 0 ? boards : DEFAULT_BOARDS;
  const activeBoard = effectiveBoards.find((b) => b.id === activeBoardId) ?? effectiveBoards[0];
  const boardCards = cards.filter((c) => c.boardId === activeBoard.id);
  const isDevelopmentBoard = activeBoard.id === "board-irapp-dev";

  const handleSaveCard = useCallback(
    (card: KanbanCardType) => {
      actions.upsertKanbanCard(card);

      const col = activeBoard.columns.find((c) => c.id === card.columnId);
      if (col?.autoArchive && col.maxVisible) {
        const colCards = cards
          .filter((c) => c.boardId === activeBoard.id && c.columnId === col.id && !c.archived && c.id !== card.id)
          .concat(card.archived ? [] : [card])
          .sort((a, b) => a.position - b.position);

        if (colCards.length > col.maxVisible) {
          const toArchive = colCards.slice(0, colCards.length - col.maxVisible);
          toArchive.forEach((c) =>
            actions.upsertKanbanCard({ ...c, archived: true, updatedAt: new Date().toISOString() })
          );
        }
      }
    },
    [actions, activeBoard, cards]
  );

  const handleMoveCard = useCallback(
    (card: KanbanCardType, toColumnId: string) => {
      const now = new Date().toISOString();
      const moved = { ...card, columnId: toColumnId, updatedAt: now };
      handleSaveCard(moved);
    },
    [handleSaveCard]
  );

  const handleQuickAdd = useCallback(
    (columnId: string, title: string) => {
      const now = new Date().toISOString();
      const card: KanbanCardType = {
        id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        boardId: activeBoard.id,
        columnId,
        title,
        actions: isDevelopmentBoard ? [] : undefined,
        position: Date.now(),
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      handleSaveCard(card);
    },
    [activeBoard.id, isDevelopmentBoard, handleSaveCard]
  );

  const handleDeleteCard = useCallback(
    (id: string) => {
      actions.deleteKanbanCard(id);
    },
    [actions]
  );

  const handleArchiveCard = useCallback(
    (id: string) => {
      const card = cards.find((c) => c.id === id);
      if (card) {
        actions.upsertKanbanCard({ ...card, archived: true, updatedAt: new Date().toISOString() });
      }
    },
    [actions, cards]
  );

  const handleRestoreCard = useCallback(
    (card: KanbanCardType) => {
      actions.upsertKanbanCard({ ...card, archived: false, updatedAt: new Date().toISOString() });
    },
    [actions]
  );

  const handleAddBoard = useCallback(
    (name: string, columnNames: string[]) => {
      const now = new Date().toISOString();
      const boardId = `board-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const columns: KanbanColumn[] = columnNames.map((title, i) => ({
        id: `col-${boardId}-${i}`,
        title,
        cardIds: [],
      }));
      const board: KanbanBoardType = {
        id: boardId,
        name,
        columns,
        createdAt: now,
        updatedAt: now,
      };
      actions.upsertKanbanBoard(board);
      setActiveBoardId(boardId);
    },
    [actions]
  );

  const handleDeleteBoard = useCallback(
    (boardId: string) => {
      const board = effectiveBoards.find((b) => b.id === boardId);
      if (board?.isDefault) return;
      cards.filter((c) => c.boardId === boardId).forEach((c) => actions.deleteKanbanCard(c.id));
      actions.deleteKanbanBoard(boardId);
      setActiveBoardId(effectiveBoards[0]?.id ?? "board-irapp-dev");
    },
    [actions, cards, effectiveBoards]
  );

  const archivedCards = showArchived
    ? boardCards.filter((c) => c.archived && c.columnId === showArchived)
    : [];

  return (
    <div className="space-y-4">
      {/* Board switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        {effectiveBoards.map((board) => (
          <div key={board.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveBoardId(board.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeBoard.id === board.id
                  ? "bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/30"
                  : "bg-panel border border-border text-fg-muted hover:text-fg hover:border-border-strong"
              }`}
            >
              {board.name}
            </button>
            {!board.isDefault && activeBoard.id === board.id && (
              <button
                type="button"
                onClick={() => handleDeleteBoard(board.id)}
                className="ml-1 rounded-lg p-1.5 text-fg-subtle hover:text-red-400 transition-colors"
                title="Delete board"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        <GlassButton variant="ghost" onClick={() => setShowAddBoard(true)} className="!px-3 !py-2">
          <Plus className="w-4 h-4 mr-1" /> New Board
        </GlassButton>
      </div>

      {/* Active board */}
      <KanbanBoard
        board={activeBoard}
        cards={boardCards}
        fullWidth={isDevelopmentBoard}
        onEditCard={setEditCard}
        onAddCard={(colId) => setAddColumnId(colId)}
        onQuickAdd={handleQuickAdd}
        onMoveCard={handleMoveCard}
        onViewArchived={(colId) => setShowArchived(colId ?? null)}
      />

      {/* Card edit/create modal */}
      <KanbanCardModal
        open={editCard !== null || addColumnId !== null}
        card={editCard}
        boardId={activeBoard.id}
        columnId={editCard?.columnId ?? addColumnId ?? ""}
        showActions={isDevelopmentBoard}
        onClose={() => {
          setEditCard(null);
          setAddColumnId(null);
        }}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
        onArchive={handleArchiveCard}
      />

      {/* Archived cards modal */}
      <ArchivedCardsModal
        open={showArchived !== null && archivedCards.length > 0}
        cards={archivedCards}
        onClose={() => setShowArchived(null)}
        onRestore={handleRestoreCard}
        onDelete={handleDeleteCard}
      />

      {/* Add board modal */}
      <AddBoardModal
        open={showAddBoard}
        onClose={() => setShowAddBoard(false)}
        onSave={handleAddBoard}
      />
    </div>
  );
}
