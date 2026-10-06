import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type {
  HasChangesValue,
  companymasterapp,
  IRAppMasterColumnId,
  IRAppMasterStatusKey,
} from "../../types";
import { EmptyState } from "../../components/motion";
import { ToastBanner } from "../../components/shared";
import { useSyncedSearch } from "../../hooks/useSyncedSearch";
import { AddClientModal } from "./AddClientModal";
import { ClientDetailDrawer } from "./ClientDetailDrawer";
import { EditClientModal } from "./EditClientModal";
import { MASTER_LIST_COLUMNS } from "./columnConfig";
import { IrappFilterBar } from "./IrappFilterBar";
import { IrappListToolbar } from "./IrappListToolbar";
import { IrappResultsSummary } from "./IrappResultsSummary";
import { IrappTable } from "./IrappTable";
import { IrappViewTabs } from "./IrappViewTabs";
import { filterApps } from "./lib/filterApps";
import {
  DEFAULT_SORT,
  DEFAULT_VIEW_ID,
  SORTABLE_COLUMNS,
  VIEW_PRESET_BY_ID,
  getPresetVisibleSet,
  type SavedViewId,
  type SortColumnId,
  type SortState,
} from "./viewPresets";

interface IRAppListSectionProps {
  apps: companymasterapp[];
  initialSearch?: string;
  onUpsert: (app: companymasterapp) => Promise<void>;
}

const STATUS_FILTER_ORDER: IRAppMasterStatusKey[] = [
  "online",
  "for_production",
  "client_testing",
  "on_development",
  "on_hold",
  "new",
  "cancelled",
  "rejected",
];

export default function IRAppListSection({
  apps,
  initialSearch = "",
  onUpsert,
}: IRAppListSectionProps) {
  const defaultPreset = VIEW_PRESET_BY_ID[DEFAULT_VIEW_ID];
  const [searchTerm, setSearchTerm] = useSyncedSearch(initialSearch);
  const [activeViewId, setActiveViewId] = useState<SavedViewId>(DEFAULT_VIEW_ID);
  const [statusFilter, setStatusFilter] = useState<Set<IRAppMasterStatusKey>>(
    () => new Set()
  );
  const [hasChangesFilter, setHasChangesFilter] = useState<Set<HasChangesValue>>(
    () => new Set()
  );
  const [visibleColumns, setVisibleColumns] = useState<Set<IRAppMasterColumnId>>(
    () => getPresetVisibleSet(defaultPreset)
  );
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<companymasterapp | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedApp = useMemo(
    () => apps.find((app) => app.id === selectedAppId) ?? null,
    [apps, selectedAppId]
  );

  const availableStatuses = useMemo(() => {
    const present = new Set(apps.map((app) => app.statusKey));
    return STATUS_FILTER_ORDER.filter((key) => present.has(key));
  }, [apps]);

  const displayedColumns = useMemo(
    () => MASTER_LIST_COLUMNS.filter((column) => visibleColumns.has(column.id)),
    [visibleColumns]
  );

  const filteredApps = useMemo(
    () => filterApps(apps, searchTerm, statusFilter, hasChangesFilter, sort),
    [apps, searchTerm, statusFilter, hasChangesFilter, sort]
  );

  function applyView(viewId: SavedViewId) {
    const preset = VIEW_PRESET_BY_ID[viewId];
    setActiveViewId(viewId);
    setVisibleColumns(getPresetVisibleSet(preset));
    setStatusFilter(new Set(preset.statusKeys ?? []));
    setHasChangesFilter(
      preset.hasChanges ? new Set([preset.hasChanges]) : new Set()
    );
  }

  function toggleStatus(status: IRAppMasterStatusKey) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function toggleHasChanges(value: HasChangesValue) {
    setHasChangesFilter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function handleSort(column: IRAppMasterColumnId) {
    if (!SORTABLE_COLUMNS.has(column)) return;
    const sortColumn = column as SortColumnId;
    setSort((prev) => {
      if (prev.column === sortColumn) {
        return {
          column: sortColumn,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { column: sortColumn, direction: "asc" };
    });
  }

  function isColumnVisible(id: IRAppMasterColumnId) {
    return visibleColumns.has(id);
  }

  async function handleUpsert(app: companymasterapp, message: string) {
    await onUpsert(app);
    setToast(message);
  }

  const hasActiveFilters = statusFilter.size > 0 || hasChangesFilter.size > 0;

  return (
    <div className="space-y-6">
      {toast && <ToastBanner message={toast} />}

      <div className="space-y-3 rounded-xl border border-border bg-panel p-4">
        <IrappListToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          onAddClient={() => setAddOpen(true)}
          currentApps={filteredApps}
          allApps={apps}
        />
        <IrappViewTabs activeViewId={activeViewId} onSelectView={applyView} />
        <IrappFilterBar
          availableStatuses={availableStatuses}
          statusFilter={statusFilter}
          hasChangesFilter={hasChangesFilter}
          hasActiveFilters={hasActiveFilters}
          onToggleStatus={toggleStatus}
          onClearStatus={() => setStatusFilter(new Set())}
          onToggleHasChanges={toggleHasChanges}
          onClearHasChanges={() => setHasChangesFilter(new Set())}
          onClearFilters={() => {
            setStatusFilter(new Set());
            setHasChangesFilter(new Set());
          }}
        />
      </div>

      <IrappResultsSummary
        filteredCount={filteredApps.length}
        totalCount={apps.length}
        activeViewId={activeViewId}
      />

      {filteredApps.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          message="No Company clients found matching search parameters."
        />
      ) : (
        <IrappTable
          apps={filteredApps}
          displayedColumns={displayedColumns}
          sort={sort}
          isColumnVisible={isColumnVisible}
          onSort={handleSort}
          onSelectApp={setSelectedAppId}
          onEditApp={setEditingApp}
        />
      )}

      <ClientDetailDrawer
        app={selectedApp}
        onClose={() => setSelectedAppId(null)}
        onEdit={(app) => setEditingApp(app)}
        onSave={async (app) => {
          await handleUpsert(app, `Updated comments for ${app.companyName}.`);
        }}
      />

      <AddClientModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={async (app) => {
          await handleUpsert(app, `Added ${app.companyName}.`);
          setSelectedAppId(app.id);
        }}
      />

      <EditClientModal
        app={editingApp}
        open={Boolean(editingApp)}
        onClose={() => setEditingApp(null)}
        onSave={async (app) => {
          await handleUpsert(app, `Updated ${app.companyName}.`);
        }}
      />
    </div>
  );
}
