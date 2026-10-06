import { useEffect, useRef, useState } from "react";
import { Check, Columns3 } from "lucide-react";
import type { IRAppMasterColumnId } from "../../types";
import { MASTER_LIST_COLUMNS } from "./columnConfig";
import { LOCKED_VISIBLE_COLUMNS } from "./viewPresets";
import { GlassButton } from "../../components/motion";

interface ColumnPickerProps {
  visibleColumns: Set<IRAppMasterColumnId>;
  onChange: (next: Set<IRAppMasterColumnId>) => void;
}

export function ColumnPicker({ visibleColumns, onChange }: ColumnPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function toggleColumn(id: IRAppMasterColumnId) {
    if (LOCKED_VISIBLE_COLUMNS.includes(id)) return;
    const next = new Set(visibleColumns);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    for (const locked of LOCKED_VISIBLE_COLUMNS) next.add(locked);
    onChange(next);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <GlassButton
        type="button"
        variant="ghost"
        className="shrink-0 whitespace-nowrap"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Columns3 className="h-3.5 w-3.5" />
        Columns
      </GlassButton>

      {open && (
        <div
          role="dialog"
          aria-label="Column visibility"
          className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-border bg-panel-elevated p-3 shadow-xl backdrop-blur-md"
        >
          <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
            Show / hide columns
          </p>
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            {MASTER_LIST_COLUMNS.map((column) => {
              const locked = LOCKED_VISIBLE_COLUMNS.includes(column.id);
              const checked = visibleColumns.has(column.id);
              return (
                <li key={column.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => toggleColumn(column.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                      locked
                        ? "cursor-default text-fg-muted"
                        : "text-fg-muted hover:bg-white/5 hover:text-fg"
                    }`}
                  >
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                        checked
                          ? "border-sky-500/50 bg-sky-500/20 text-sky-700 dark:text-sky-300"
                          : "border-border-strong bg-transparent text-transparent"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="flex-1">{column.label}</span>
                    {locked && (
                      <span className="text-[9px] uppercase tracking-wide text-fg-subtle">
                        required
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
