import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardX } from "lucide-react";
import { SearchInput } from "../../components/SearchInput";
import { EmptyState } from "../../components/motion";
import type {
  companymasterapp,
  ReportTrackerEntry,
} from "../../types";
import { EditEntryModal } from "./EditEntryModal";
import { ReportTrackerTable } from "./ReportTrackerTable";
import { matchReportEntriesToClients } from "./matchClients";
import { createEntryFromApp } from "./quarterUtils";

interface ReportTrackerSectionProps {
  apps: companymasterapp[];
  entries: ReportTrackerEntry[];
  onUpsert: (entry: ReportTrackerEntry) => Promise<void>;
  initialSearch?: string;
}

type CompletionFilter = "all" | "open" | "done";

function isComplete(entry: ReportTrackerEntry): boolean {
  return (
    entry.financialReports === true &&
    entry.annualReports === true &&
    entry.esgReports === true
  );
}

export function ReportTrackerSection({
  apps,
  entries,
  onUpsert,
  initialSearch = "",
}: ReportTrackerSectionProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("all");
  const [editingEntry, setEditingEntry] = useState<ReportTrackerEntry | null>(
    null
  );
  const knownAppIdsRef = useRef<Set<string>>(new Set(apps.map((app) => app.id)));
  const onUpsertRef = useRef(onUpsert);
  onUpsertRef.current = onUpsert;

  const linkedEntries = useMemo(
    () => matchReportEntriesToClients(entries, apps),
    [entries, apps]
  );

  useEffect(() => {
    const previousIds = knownAppIdsRef.current;
    const newApps = apps.filter((app) => !previousIds.has(app.id));
    knownAppIdsRef.current = new Set(apps.map((app) => app.id));

    for (const entry of linkedEntries) {
      const prior = entries.find((row) => row.id === entry.id);
      if (
        prior &&
        prior.irappClientId !== entry.irappClientId &&
        entry.irappClientId
      ) {
        void onUpsertRef.current(entry);
      }
    }

    if (newApps.length === 0) return;

    const linkedIds = new Set(
      linkedEntries
        .map((entry) => entry.irappClientId)
        .filter(Boolean) as string[]
    );
    for (const app of newApps) {
      if (!linkedIds.has(app.id)) {
        void onUpsertRef.current(createEntryFromApp(app));
      }
    }
  }, [apps, linkedEntries, entries]);

  const appsById = useMemo(
    () => new Map(apps.map((app) => [app.id, app])),
    [apps]
  );

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return linkedEntries.filter((entry) => {
      if (query) {
        const linkedName = entry.irappClientId
          ? appsById.get(entry.irappClientId)?.companyName ?? ""
          : "";
        if (
          !`${entry.appName} ${entry.companyCode} ${linkedName}`
            .toLowerCase()
            .includes(query)
        ) {
          return false;
        }
      }
      if (completionFilter === "done") return isComplete(entry);
      if (completionFilter === "open") return !isComplete(entry);
      return true;
    });
  }, [linkedEntries, searchTerm, appsById, completionFilter]);

  const completedCount = linkedEntries.filter(isComplete).length;
  const percentage = linkedEntries.length
    ? Math.round((completedCount / linkedEntries.length) * 100)
    : 0;

  function handleUpdateEntry(next: ReportTrackerEntry) {
    void onUpsert(next);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-panel p-4 backdrop-blur-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-fg">Report monitoring</h2>
            <p className="mt-1 text-xs text-fg-subtle">
              Sample tracker data · update each report category as it is received.
            </p>
          </div>
          <div className="w-full md:w-80">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search company or code…"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: "all", label: "All" },
                { id: "open", label: "Open" },
                { id: "done", label: "Done" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCompletionFilter(option.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  completionFilter === option.id
                    ? "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                    : "border-border bg-panel text-fg-subtle hover:text-fg"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-fg-subtle">
            {completedCount} of {linkedEntries.length} companies complete
            {` · ${percentage}%`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-[11px] text-fg-subtle">
        <p>
          Showing{" "}
          <span className="font-mono text-fg-muted">{filteredEntries.length}</span>{" "}
          of{" "}
          <span className="font-mono text-fg-muted">{linkedEntries.length}</span>{" "}
          companies
        </p>
        <p className="hidden sm:block">
          Click a report status to mark it uploaded or missing
        </p>
      </div>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={<ClipboardX className="w-8 h-8" />}
          message="No companies match these filters. Try another search or status."
        />
      ) : (
        <ReportTrackerTable
          entries={filteredEntries}
          appsById={appsById}
          onEditEntry={setEditingEntry}
          onUpdateEntry={handleUpdateEntry}
        />
      )}

      <EditEntryModal
        open={Boolean(editingEntry)}
        entry={editingEntry}
        linkedApp={
          editingEntry?.irappClientId
            ? appsById.get(editingEntry.irappClientId)
            : undefined
        }
        onClose={() => setEditingEntry(null)}
        onSave={(patch) => {
          if (!editingEntry) return;
          handleUpdateEntry({ ...editingEntry, ...patch });
        }}
      />
    </div>
  );
}
