import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Download, Loader2 } from "lucide-react";
import type { companymasterapp, IRAppMasterColumnId } from "../../types";
import { GlassButton } from "../../components/motion";
import {
  exportIrappList,
  type ExportFormat,
  type ExportScope,
} from "./lib/exportApps";

interface ExportMenuProps {
  currentApps: companymasterapp[];
  allApps: companymasterapp[];
  visibleColumns: Set<IRAppMasterColumnId>;
}

type MenuStep = "scope" | "format";

const LOADING_DELAY_MS = 1000;

export function ExportMenu({
  currentApps,
  allApps,
  visibleColumns,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<MenuStep>("scope");
  const [scope, setScope] = useState<ExportScope | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    if (!open) {
      setStep("scope");
      setScope(null);
      setIsLoading(false);
    }
  }, [open]);

  function selectScope(next: ExportScope) {
    setScope(next);
    setStep("format");
  }

  async function runExport(format: ExportFormat) {
    if (!scope || isLoading) return;

    const loadingTimer = window.setTimeout(() => {
      setIsLoading(true);
    }, LOADING_DELAY_MS);

    try {
      // Yield so the UI can paint the spinner if generation exceeds 1s.
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 0);
      });
      await exportIrappList({
        scope,
        format,
        currentApps,
        allApps,
        visibleColumns,
      });
      setOpen(false);
    } catch (error) {
      console.error("Company List export failed", error);
    } finally {
      window.clearTimeout(loadingTimer);
      setIsLoading(false);
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <GlassButton
        type="button"
        variant="ghost"
        className="shrink-0 whitespace-nowrap"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden />
        )}
        {isLoading ? "Exporting…" : "Export …"}
      </GlassButton>

      {open && (
        <div
          role="menu"
          aria-label="Export Company List"
          className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-border bg-panel-elevated p-2 shadow-xl backdrop-blur-md"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-fg-muted">
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" aria-hidden />
              Generating report…
            </div>
          ) : step === "scope" ? (
            <div className="space-y-0.5">
              <p className="mb-1.5 px-2 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Export scope
              </p>
              <MenuItem
                label="Current table"
                hint={`${currentApps.length} row${currentApps.length === 1 ? "" : "s"}, visible columns`}
                onClick={() => selectScope("current")}
              />
              <MenuItem
                label="All data"
                hint={`${allApps.length} row${allApps.length === 1 ? "" : "s"}, all columns`}
                onClick={() => selectScope("all")}
              />
            </div>
          ) : (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setStep("scope");
                  setScope(null);
                }}
                className="mb-1 flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-left text-[11px] text-fg-subtle transition-colors hover:bg-white/5 hover:text-fg-muted"
              >
                <ChevronLeft className="h-3 w-3" />
                Back
                {scope === "current" ? " · Current table" : " · All data"}
              </button>
              <p className="mb-1.5 px-2 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Format
              </p>
              <MenuItem label="Export as CSV" onClick={() => void runExport("csv")} />
              <MenuItem label="Export as XLSX" onClick={() => void runExport("xlsx")} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  label,
  hint,
  onClick,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
    >
      <span className="text-xs font-medium text-fg">{label}</span>
      {hint && <span className="text-[10px] text-fg-subtle">{hint}</span>}
    </button>
  );
}
