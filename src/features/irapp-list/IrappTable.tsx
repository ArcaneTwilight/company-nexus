import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Fragment } from "react";
import type { companymasterapp, IRAppMasterColumnId } from "../../types";
import { MASTER_LIST_COLUMNS } from "./columnConfig";
import { IrappTableRow } from "./companyTableRow";
import {
  SORTABLE_COLUMNS,
  type SortColumnId,
  type SortState,
} from "./viewPresets";

interface IrappTableProps {
  apps: companymasterapp[];
  displayedColumns: (typeof MASTER_LIST_COLUMNS)[number][];
  sort: SortState;
  isColumnVisible: (id: IRAppMasterColumnId) => boolean;
  onSort: (column: IRAppMasterColumnId) => void;
  onSelectApp: (id: string) => void;
  onEditApp: (app: companymasterapp) => void;
}

export function IrappTable({
  apps,
  displayedColumns,
  sort,
  isColumnVisible,
  onSort,
  onSelectApp,
  onEditApp,
}: IrappTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-left md:min-w-0">
          <thead>
            <tr className="border-b border-border bg-panel-solid">
              {displayedColumns.map((column) => {
                const sortable = SORTABLE_COLUMNS.has(column.id);
                const isActiveSort = sort.column === column.id;
                return (
                  <th
                    key={column.id}
                    className={`px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-fg-subtle ${
                      column.align === "center" ? "text-center" : ""
                    }`}
                    title={column.headerTooltip}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.id)}
                        className="inline-flex items-center gap-1 transition-colors hover:text-fg-muted"
                      >
                        {column.label}
                        {isActiveSort ? (
                          sort.direction === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-sky-400" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-sky-400" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <Fragment key={app.id}>
                <IrappTableRow
                  app={app}
                  isColumnVisible={isColumnVisible}
                  onSelect={onSelectApp}
                  onEdit={onEditApp}
                />
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
