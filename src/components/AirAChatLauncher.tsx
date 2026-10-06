import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { NexusRepositoryActions } from "../services/nexusRepository";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { transitions } from "../lib/motion";
import { AgentChat } from "./AgentChat";

interface AirAChatLauncherProps {
  actions?: NexusRepositoryActions;
}

export function AirAChatLauncher({ actions }: AirAChatLauncherProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    }, 120);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search with AIRA"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full border border-sky-500/30 bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:bottom-6 sm:right-6"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
          <MessageCircle className="h-5 w-5" aria-hidden />
        </span>
        <span className="pr-0.5">Search with AIRA</span>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <motion.button
              type="button"
              aria-label="Close AIRA chat"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={transitions.exit}
              className="pointer-events-auto absolute inset-0 bg-overlay backdrop-blur-[1px]"
              onClick={close}
            />

            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: 16 }}
              transition={transitions.enter}
              className="pointer-events-auto fixed inset-x-0 bottom-0 flex max-h-[min(85vh,720px)] flex-col overflow-hidden rounded-t-2xl border border-border bg-panel-solid shadow-2xl backdrop-blur-md sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[min(400px,calc(100vw-3rem))] sm:max-h-[min(680px,calc(100vh-8rem))] sm:rounded-2xl"
            >
              <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
                <div className="min-w-0">
                  <h2 id={titleId} className="font-display text-base font-semibold text-fg sm:text-lg">
                    AIRA
                  </h2>
                  <p className="mt-0.5 text-[11px] text-fg-muted sm:text-xs">
                    AI assistant — prefer header search for lookups; ask AIRA to explain or compare.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-lg border border-border bg-panel p-2 text-fg-muted transition-colors hover:bg-panel-elevated hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="flex min-h-0 flex-1 flex-col p-3 pt-0 sm:p-4 sm:pt-0">
                <AgentChat
                  mode="hub"
                  allowWriteToggle
                  showKnowledgeModes
                  initialKnowledgeMode="auto"
                  actions={actions}
                  className="min-h-0 flex-1 border-0 bg-transparent"
                  welcome="Hello! I'm **AIRA** (AI Company Assistant). Tip: use the **header search** for quick lookups (FAQs, apps, team). Ask me when you need an explanation, comparison, or a proposed edit."
                  placeholder="Ask AIRA to explain or find something…"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
