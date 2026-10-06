import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SearchInput } from "../components/SearchInput";
import { DropdownPanel } from "../components/motion";
import {
  searchNexusCollections,
  type GlobalSearchCollections,
} from "../lib/globalSearch";
import type { AppTab } from "./types";

interface GlobalSearchProps {
  collections: GlobalSearchCollections;
  onNavigate: (tab: AppTab, filter?: string) => void;
}

export function GlobalSearch({ collections, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(
    () => searchNexusCollections(query, collections),
    [query, collections]
  );

  return (
    <div className="relative w-full sm:w-64 z-20">
      <SearchInput
        value={query}
        onChange={(value) => {
          setQuery(value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        onClear={() => setShowResults(false)}
        placeholder="Global Search Nexus..."
        inputClassName="w-full pl-9 pr-8 py-2 bg-panel-solid border border-border rounded-xl text-xs sm:text-sm text-fg placeholder:text-fg-subtle focus:outline-none font-sans input-glass-focus"
      />

      <AnimatePresence>
        {showResults && query && (
          <DropdownPanel className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-panel-elevated border border-border shadow-2xl z-[100] max-h-[min(300px,60vh)] overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1 text-[12px] uppercase font-mono tracking-wider text-fg-subtle border-b border-border mb-1 flex justify-between">
              <span>Matches ({results.length})</span>
              <button
                type="button"
                onClick={() => setShowResults(false)}
                className="hover:text-fg transition-colors"
              >
                Close
              </button>
            </div>

            {results.length === 0 ? (
              <p className="p-3 text-center text-xs text-fg-subtle font-mono">
                No matching records.
              </p>
            ) : (
              results.map((res, index) => (
                <motion.button
                  key={`${res.type}-${res.id}`}
                  type="button"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => {
                    onNavigate(res.tab, res.title);
                    setQuery("");
                    setShowResults(false);
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-panel transition-colors flex flex-col cursor-pointer"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold text-xs text-fg tracking-tight leading-tight truncate">
                      {res.title}
                    </span>
                    <span className="text-[11px] uppercase font-mono px-1.5 py-0.5 rounded bg-panel border border-border text-sky-700 dark:text-sky-400 shrink-0">
                      {res.type}
                    </span>
                  </div>
                  <span className="text-[12px] text-fg-subtle font-sans truncate mt-1">
                    {res.desc}
                  </span>
                </motion.button>
              ))
            )}
          </DropdownPanel>
        )}
      </AnimatePresence>
    </div>
  );
}
