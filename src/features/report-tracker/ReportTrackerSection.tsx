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
import { QuarterSelector } from "./QuarterSelector";
import { OthersEditorModal } from "./OthersEditorModal";
import { matchReportEntriesToClients } from "./matchClients";
import {
  annualYearForView,
  computeStats,
  createEntryFromApp,
  getAnnualStatus,
  getPreviousQuarter,
  getQuarterStatus,
  isEntryCompletedForView,
  quarterKey,
  withDerivedQuarterCompleted,
} from "./quarterUtils";
import type { OtherReportItem, ReportQuarterView } from "../../types";

interface ReportTrackerSectionProps {
  apps: companymasterapp[];
  entries: ReportTrackerEntry[];
  onUpsert: (entry: ReportTrackerEntry) => Promise<void>;
  initialSearch?: string;
}

type CompletionFilter = "all" | "open" | "done";

export function ReportTrackerSection({
  apps,
  entries,
  onUpsert,
  initialSearch = "",
}: ReportTrackerSectionProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("all");
  const [period, setPeriod] = useState<{
    year: number;
    quarter: ReportQuarterView;
  }>(getPreviousQuarter);
  const [editingEntry, setEditingEntry] = useState<ReportTrackerEntry | null>(
    null
  );
  const [editingOthers, setEditingOthers] = useState<{
    entry: ReportTrackerEntry;
    year: number;
    view: ReportQuarterView;
  } | null>(null);
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
      const completed = isEntryCompletedForView(
        entry,
        period.year,
        period.quarter
      );
      if (completionFilter === "done") return completed;
      if (completionFilter === "open") return !completed;
      return true;
    });
  }, [linkedEntries, searchTerm, appsById, completionFilter, period]);

  const stats = computeStats(linkedEntries, period.year, period.quarter);

  function handleUpdateEntry(next: ReportTrackerEntry) {
    void onUpsert(next);
  }

  function handleSaveOthers(items: OtherReportItem[]) {
    if (!editingOthers) return;
    const { entry, year, view } = editingOthers;
    if (view === "annual") {
      const key = String(annualYearForView(year));
      const status = getAnnualStatus(entry, year);
      handleUpdateEntry({
        ...entry,
        annual: {
          ...entry.annual,
          [key]: { ...status, others: items },
        },
      });
      return;
    }

    const key = quarterKey(year, view);
    const status = withDerivedQuarterCompleted({
      ...getQuarterStatus(entry, year, view),
      others: items,
    });
    handleUpdateEntry({
      ...entry,
      quarters: { ...entry.quarters, [key]: status },
    });
  }

  const editingOthersItems = editingOthers
    ? editingOthers.view === "annual"
      ? getAnnualStatus(editingOthers.entry, editingOthers.year).others
      : getQuarterStatus(
          editingOthers.entry,
          editingOthers.year,
          editingOthers.view
        ).others
    : [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-panel p-4 backdrop-blur-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-fg">Report monitoring</h2>
            <p className="mt-1 text-xs text-fg-subtle">
              Sample tracker data · update each report status as it is received.
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

        <div className="mt-4 border-t border-border pt-4">
          <QuarterSelector
            year={period.year}
            view={period.quarter}
            onYearChange={(year) =>
              setPeriod((current) => ({ ...current, year }))
            }
            onViewChange={(quarter) =>
              setPeriod((current) => ({ ...current, quarter }))
            }
          />
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
            {stats.completed} of {stats.total} companies complete
            {` · ${stats.percentage}%`}
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
          {period.quarter === "annual"
            ? `Annual reports · FY ${annualYearForView(period.year)}`
            : `${period.quarter} ${period.year}`}{" "}
          · Click a report status to update it
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
          year={period.year}
          view={period.quarter}
          onEditEntry={setEditingEntry}
          onEditOthers={(entry, year, view) =>
            setEditingOthers({ entry, year, view })
          }
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
      <OthersEditorModal
        open={Boolean(editingOthers)}
        title={
          editingOthers?.view === "annual"
            ? "Edit annual other reports"
            : "Edit quarterly other reports"
        }
        items={editingOthersItems}
        onClose={() => setEditingOthers(null)}
        onSave={handleSaveOthers}
      />
    </div>
  );
}
