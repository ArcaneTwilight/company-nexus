import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList } from "lucide-react";
import { SearchInput } from "../../components/SearchInput";
import { EmptyState, FilterChip } from "../../components/motion";
import type { companymasterapp, ProductionTrackerEntry } from "../../types";
import { EditEntryModal } from "./EditEntryModal";
import { ProductionTrackerTable } from "./ProductionTrackerTable";
import {
  ACTIVE_PRIORITIES,
  PHASE_OPTIONS,
  PRIORITY_OPTIONS,
  phaseSortKey,
  prioritySortKey,
} from "./constants";
import { matchProductionEntriesToApps } from "./matchApps";

interface ProductionTrackerSectionProps {
  apps: companymasterapp[];
  entries: ProductionTrackerEntry[];
  onUpsert: (entry: ProductionTrackerEntry) => Promise<void>;
  initialSearch?: string;
}

type FocusFilter = "active" | "all";

export function ProductionTrackerSection({
  apps,
  entries,
  onUpsert,
  initialSearch = "",
}: ProductionTrackerSectionProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("active");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [devFilter, setDevFilter] = useState("All");
  const [pssFilter, setPssFilter] = useState("All");
  const [editingEntry, setEditingEntry] = useState<ProductionTrackerEntry | null>(
    null
  );

  const onUpsertRef = useRef(onUpsert);
  onUpsertRef.current = onUpsert;

  const linkedEntries = useMemo(
    () => matchProductionEntriesToApps(entries, apps),
    [entries, apps]
  );

  // Persist rematched Company links when heuristics improve the match
  useEffect(() => {
    for (const entry of linkedEntries) {
      const prior = entries.find((row) => row.id === entry.id);
      if (
        prior &&
        prior.companyAppId !== entry.companyAppId &&
        entry.companyAppId
      ) {
        void onUpsertRef.current(entry);
      }
    }
  }, [linkedEntries, entries]);

  const appsById = useMemo(() => {
    const map = new Map<string, companymasterapp>();
    for (const app of apps) map.set(app.id, app);
    return map;
  }, [apps]);

  const uniqueDevs = useMemo(() => {
    const set = new Set<string>();
    for (const entry of linkedEntries) {
      if (entry.assignedDev.trim()) set.add(entry.assignedDev.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [linkedEntries]);

  const uniquePss = useMemo(() => {
    const set = new Set<string>();
    for (const entry of linkedEntries) {
      if (entry.assignedPss.trim()) set.add(entry.assignedPss.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [linkedEntries]);

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = linkedEntries.filter((entry) => {
      if (focusFilter === "active" && !ACTIVE_PRIORITIES.has(entry.priority)) {
        return false;
      }
      if (priorityFilter !== "All" && entry.priority !== priorityFilter) {
        return false;
      }
      if (phaseFilter !== "All" && entry.currentPhase !== phaseFilter) {
        return false;
      }
      if (devFilter !== "All" && entry.assignedDev !== devFilter) {
        return false;
      }
      if (pssFilter !== "All" && entry.assignedPss !== pssFilter) {
        return false;
      }
      if (query) {
        const haystack = [
          entry.clientName,
          entry.priority,
          entry.assignedDev,
          entry.assignedPss,
          entry.currentPhase,
          entry.comments ?? "",
          entry.companyAppId
            ? appsById.get(entry.companyAppId)?.companyName ?? ""
            : "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const byPriority = prioritySortKey(a.priority) - prioritySortKey(b.priority);
      if (byPriority !== 0) return byPriority;
      const byPhase = phaseSortKey(a.currentPhase) - phaseSortKey(b.currentPhase);
      if (byPhase !== 0) return byPhase;
      return a.clientName.localeCompare(b.clientName);
    });
  }, [
    linkedEntries,
    searchTerm,
    focusFilter,
    priorityFilter,
    phaseFilter,
    devFilter,
    pssFilter,
    appsById,
  ]);

  const stats = useMemo(() => {
    const source =
      focusFilter === "active"
        ? linkedEntries.filter((e) => ACTIVE_PRIORITIES.has(e.priority))
        : linkedEntries;
    const p1 = source.filter((e) => e.priority === "[P1]").length;
    const p2 = source.filter((e) => e.priority === "[P2]").length;
    const pending = source.filter((e) => e.priority === "Pending").length;
    const inDev = source.filter((e) =>
      ["Development", "Internal Testing", "Setting up requirements"].includes(
        e.currentPhase
      )
    ).length;
    return { total: source.length, p1, p2, pending, inDev };
  }, [linkedEntries, focusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-80">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search clients, owners, phase…"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            label="Active"
            active={focusFilter === "active"}
            onClick={() => setFocusFilter("active")}
          />
          <FilterChip
            label="All"
            active={focusFilter === "all"}
            onClick={() => setFocusFilter("all")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Showing", value: stats.total },
          { label: "P1", value: stats.p1 },
          { label: "P2", value: stats.p2 },
          { label: "Pending", value: stats.pending },
          { label: "In build", value: stats.inDev },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-panel-solid/60 px-3 py-2.5"
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
              {stat.label}
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-fg">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel p-3">
        <FilterRow
          label="Priority"
          value={priorityFilter}
          options={["All", ...PRIORITY_OPTIONS]}
          onChange={setPriorityFilter}
        />
        <FilterRow
          label="Phase"
          value={phaseFilter}
          options={["All", ...PHASE_OPTIONS]}
          onChange={setPhaseFilter}
        />
        <FilterRow
          label="Dev"
          value={devFilter}
          options={["All", ...uniqueDevs]}
          onChange={setDevFilter}
        />
        <FilterRow
          label="App Support"
          value={pssFilter}
          options={["All", ...uniquePss]}
          onChange={setPssFilter}
        />
      </div>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          message="No production entries match these filters."
        />
      ) : (
        <ProductionTrackerTable
          entries={filteredEntries}
          appsById={appsById}
          onEditEntry={setEditingEntry}
        />
      )}

      <p className="text-[11px] text-fg-subtle">
        {filteredEntries.length} of {linkedEntries.length} entries
        {focusFilter === "active"
          ? " · Active view hides Online / Removed / Cancelled"
          : ""}
      </p>

      <EditEntryModal
        open={Boolean(editingEntry)}
        entry={editingEntry}
        linkedApp={
          editingEntry?.companyAppId
            ? appsById.get(editingEntry.companyAppId)
            : undefined
        }
        onClose={() => setEditingEntry(null)}
        onSave={(patch) => {
          if (!editingEntry) return;
          void onUpsert({
            ...editingEntry,
            ...patch,
            updatedAt: new Date().toISOString(),
          });
        }}
      />
    </div>
  );
}

function FilterRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
      <span className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <FilterChip
            key={option}
            label={option}
            active={value === option}
            onClick={() => onChange(option)}
          />
        ))}
      </div>
    </div>
  );
}
