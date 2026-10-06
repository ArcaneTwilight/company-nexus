import { Plus } from "lucide-react";
import { SearchInput } from "../../components/SearchInput";
import { GlassButton } from "../../components/motion";
import type { companymasterapp, IRAppMasterColumnId } from "../../types";
import { ColumnPicker } from "./ColumnPicker";
import { ExportMenu } from "./ExportMenu";
import { TableLegend } from "./TableLegend";

interface IrappListToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  visibleColumns: Set<IRAppMasterColumnId>;
  onVisibleColumnsChange: (columns: Set<IRAppMasterColumnId>) => void;
  onAddClient: () => void;
  currentApps: companymasterapp[];
  allApps: companymasterapp[];
}

export function IrappListToolbar({
  searchTerm,
  onSearchChange,
  visibleColumns,
  onVisibleColumnsChange,
  onAddClient,
  currentApps,
  allApps,
}: IrappListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="w-full sm:w-80 lg:w-80">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search company, status, market..."
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
        <GlassButton
          type="button"
          variant="primary"
          className="shrink-0 whitespace-nowrap"
          onClick={onAddClient}
        >
          <Plus className="h-3.5 w-3.5" />
          Add client
        </GlassButton>
        <ColumnPicker visibleColumns={visibleColumns} onChange={onVisibleColumnsChange} />
        <TableLegend />
        <ExportMenu
          currentApps={currentApps}
          allApps={allApps}
          visibleColumns={visibleColumns}
        />
      </div>
    </div>
  );
}
