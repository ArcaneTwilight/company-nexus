import { useState, type MouseEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { WelcomeMessage } from "../components/WelcomeMessage";
import { ThemeToggle } from "../components/shared";
import { ModalShell } from "../components/modals";
import BoxLoader from "../components/ui/box-loader";
import { WELCOME_PHRASES } from "./constants";
import { GlobalSearch } from "./GlobalSearch";
import type { AppTab } from "./types";
import type { GlobalSearchCollections } from "../lib/globalSearch";

interface AppHeaderProps {
  useFirestore: boolean;
  syncError: string | null;
  collections: GlobalSearchCollections;
  onNavigate: (tab: AppTab, filter?: string) => void;
}

export function AppHeader({
  useFirestore,
  syncError,
  collections,
  onNavigate,
}: AppHeaderProps) {
  const [aboutOpen, setAboutOpen] = useState(false);

  function handleBrandClick(event: MouseEvent) {
    if (event.detail === 3) setAboutOpen(true);
  }

  return (
    <>
      <header className="app-header p-4 sm:p-5 glass-container border border-border flex flex-col md:flex-row gap-4 justify-between items-center relative z-30 shadow-2xl">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleBrandClick}
            className="w-10 h-10 cyber-brand-mark flex items-center justify-center cursor-default"
            aria-label="Company Nexus"
          >
            <ShieldCheck className="w-6 h-6 text-white pointer-events-none" />
          </button>
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold font-display tracking-widest text-fg flex items-center gap-2 cursor-default select-none cyber-heading"
              onClick={handleBrandClick}
            >
              Company Nexus
            </h1>
            <span className="text-[11px] uppercase tracking-wider font-mono text-fg-subtle mt-1 block">
              Company homebase
              {useFirestore ? (
                <span className="ml-2 text-emerald-600 dark:text-emerald-400/80 normal-case tracking-normal">
                  • Live sync with Firebase
                </span>
              ) : (
                <span className="ml-2 text-amber-600 dark:text-amber-300 normal-case tracking-normal">
                  • Offline MVP sample
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="text-center flex-1 px-2 order-3 md:order-none w-full md:w-auto">
          <WelcomeMessage phrases={WELCOME_PHRASES} />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative shrink-0 order-4 md:order-none z-20">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <GlobalSearch collections={collections} onNavigate={onNavigate} />
            <ThemeToggle />
          </div>
          {syncError && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-mono w-full md:w-auto text-center md:text-right">
              Sync issue: {syncError}
            </p>
          )}
        </div>
      </header>

      <ModalShell open={aboutOpen} title="Company Nexus" onClose={() => setAboutOpen(false)}>
        <div className="space-y-4 text-center">
          <p className="text-sm text-fg-muted">
            Created by Deevann Shrestha — V1.0
          </p>
          {aboutOpen && <BoxLoader />}
        </div>
      </ModalShell>
    </>
  );
}
