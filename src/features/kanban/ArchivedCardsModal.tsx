import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { ModalShell } from "../../components/modals/ModalShell";
import { GlassButton } from "../../components/motion";
import type { KanbanCard } from "../../types";

interface ArchivedCardsModalProps {
  open: boolean;
  cards: KanbanCard[];
  onClose: () => void;
  onRestore: (card: KanbanCard) => void;
  onDelete: (id: string) => void;
}

export function ArchivedCardsModal({
  open,
  cards,
  onClose,
  onRestore,
  onDelete,
}: ArchivedCardsModalProps) {
  return (
    <ModalShell open={open} title="Archived Cards" onClose={onClose} wide>
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-fg-muted">
          <Archive className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No archived cards</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-panel px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg truncate">{card.title}</p>
                {card.actions && card.actions.length > 0 && (
                  <p className="text-xs text-fg-muted mt-0.5 truncate">
                    {card.actions.join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <GlassButton
                  variant="ghost"
                  onClick={() => onRestore(card)}
                  className="!px-2 !py-1.5"
                  title="Restore"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  onClick={() => onDelete(card.id)}
                  className="!px-2 !py-1.5 !text-red-400 hover:!text-red-300"
                  title="Delete permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </GlassButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}
