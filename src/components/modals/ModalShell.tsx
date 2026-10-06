import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { transitions } from "../../lib/motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { GlassButton } from "../motion";

interface ModalShellProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

/** Shared glass modal shell for create/edit flows. */
export function ModalShell({
  open,
  title,
  description,
  onClose,
  children,
  wide = false,
}: ModalShellProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  // Portal to body so fixed overlay isn't clipped by parent glass/overflow containers
  // (e.g. Stock Exchanges `.glass-container` + `overflow-hidden` + backdrop-filter).
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={transitions.exit}
            className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nexus-modal-title"
            initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
            transition={transitions.enter}
            className={`glass-container relative z-10 w-full ${
              wide ? "max-w-xl" : "max-w-md"
            } rounded-2xl border border-border shadow-2xl`}
          >
            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h3
                  id="nexus-modal-title"
                  className="font-display text-lg font-semibold text-fg"
                >
                  {title}
                </h3>
                {description && (
                  <p className="mt-1 text-xs text-fg-muted">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border bg-panel p-2 text-fg-muted transition-colors hover:bg-panel-elevated hover:text-fg"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export const fieldClass =
  "w-full rounded-xl border border-border bg-panel-solid px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/30";

export const labelClass =
  "mb-1.5 block text-[10px] font-mono uppercase tracking-wider text-fg-subtle";

interface ModalActionsProps {
  onCancel: () => void;
  submitLabel: string;
  saving?: boolean;
  disabled?: boolean;
}

export function ModalActions({
  onCancel,
  submitLabel,
  saving = false,
  disabled = false,
}: ModalActionsProps) {
  return (
    <div className="mt-5 flex items-center justify-end gap-2">
      <GlassButton type="button" variant="ghost" onClick={onCancel} disabled={saving}>
        Cancel
      </GlassButton>
      <GlassButton type="submit" variant="primary" disabled={disabled || saving}>
        {saving ? "Saving…" : submitLabel}
      </GlassButton>
    </div>
  );
}
