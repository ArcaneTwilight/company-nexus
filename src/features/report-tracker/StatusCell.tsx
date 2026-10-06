import { Check, Minus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface StatusToggleProps {
  value: boolean | null;
  label: string;
  onChange: (value: boolean | null) => void;
}

/** Clickable status indicator with a small check / missing / N/A popover. */
export function StatusToggle({ value, label, onChange }: StatusToggleProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex justify-center">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label}: ${value === true ? "uploaded" : value === false ? "missing" : "N/A"} — click to change`}
        title={`${label} — click to update`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
      >
        <StatusIcon value={value} />
      </button>

      {open && (
        <div
          id={panelId}
          role="listbox"
          aria-label={`Set ${label} status`}
          className="absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 rounded-xl border border-border bg-panel-solid p-1.5 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            <OptionButton
              active={value === true}
              label="Uploaded"
              onClick={() => {
                onChange(true);
                setOpen(false);
              }}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </OptionButton>
            <OptionButton
              active={value === false}
              label="Missing"
              onClick={() => {
                onChange(false);
                setOpen(false);
              }}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </OptionButton>
            <OptionButton
              active={value === null}
              label="N/A"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-panel text-fg-subtle">
                <Minus className="h-3 w-3" strokeWidth={2} />
              </span>
            </OptionButton>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ value }: { value: boolean | null }) {
  if (value === true) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 dark:text-rose-400">
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-panel text-fg-subtle">
      <Minus className="h-3 w-3" strokeWidth={2} />
    </span>
  );
}

function OptionButton({
  children,
  label,
  active,
  onClick,
}: {
  children: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-selected={active}
      onClick={onClick}
      className={`rounded-lg p-0.5 transition-colors ${
        active ? "bg-sky-500/15 ring-1 ring-sky-500/30" : "hover:bg-panel"
      }`}
    >
      {children}
    </button>
  );
}

interface CompletedBadgeProps {
  completed: boolean;
}

export function CompletedBadge({ completed }: CompletedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
        completed
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      {completed ? "Done" : "Open"}
    </span>
  );
}

/** Display Others labels with green (uploaded) / red (missing) styling. */
export function OthersSummary({
  items,
  onClick,
}: {
  items: { label: string; uploaded: boolean }[];
  onClick: () => void;
}) {
  if (items.length === 0) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className="text-xs text-fg-subtle hover:text-fg-muted"
      >
        —
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="max-w-[10rem] text-left text-xs leading-snug hover:underline"
      title="Edit other reports"
    >
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 ? <span className="text-fg-subtle">, </span> : null}
          <span
            className={
              item.uploaded
                ? "font-bold text-emerald-600 dark:text-emerald-400"
                : "font-medium text-rose-600 dark:text-rose-400"
            }
          >
            {item.label}
          </span>
        </span>
      ))}
    </button>
  );
}
