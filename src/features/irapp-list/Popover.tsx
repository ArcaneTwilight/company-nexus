import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useCallback,
} from "react";
import { AnimatePresence } from "motion/react";
import { DropdownPanel } from "../../components/motion";

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  /** Optional label for the panel header */
  title?: string;
  align?: "left" | "right";
  className?: string;
  panelClassName?: string;
}

/** Lightweight click popover with outside-click + Escape dismiss. */
export function Popover({
  trigger,
  children,
  title,
  align = "right",
  className = "",
  panelClassName = "",
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="inline-flex items-center"
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <div
            id={panelId}
            className={`absolute z-50 mt-2 ${align === "right" ? "right-0" : "left-0"}`}
          >
            <DropdownPanel
              className={`glass-card min-w-[14rem] max-w-[20rem] rounded-xl p-3 shadow-2xl shadow-black/40 ${panelClassName}`}
            >
              {title && (
                <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                  {title}
                </p>
              )}
              {children}
            </DropdownPanel>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
