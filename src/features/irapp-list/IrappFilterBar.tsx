import { Fragment } from "react";
import { Building2 } from "lucide-react";
import { LayoutGroup } from "motion/react";
import { FilterChip } from "../../components/motion";
import type { HasChangesValue, IRAppMasterStatusKey } from "../../types";
import { STATUS_BY_KEY } from "./columnConfig";

const HAS_CHANGES_OPTIONS: HasChangesValue[] = ["Yes", "No"];

interface IrappFilterBarProps {
  availableStatuses: IRAppMasterStatusKey[];
  statusFilter: Set<IRAppMasterStatusKey>;
  hasChangesFilter: Set<HasChangesValue>;
  hasActiveFilters: boolean;
  onToggleStatus: (status: IRAppMasterStatusKey) => void;
  onClearStatus: () => void;
  onToggleHasChanges: (value: HasChangesValue) => void;
  onClearHasChanges: () => void;
  onClearFilters: () => void;
}

export function IrappFilterBar({
  availableStatuses,
  statusFilter,
  hasChangesFilter,
  hasActiveFilters,
  onToggleStatus,
  onClearStatus,
  onToggleHasChanges,
  onClearHasChanges,
  onClearFilters,
}: IrappFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0 text-fg-muted" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
          Status
        </span>
        <LayoutGroup id="irapp-status-filters">
          <FilterChip label="All" active={statusFilter.size === 0} onClick={onClearStatus} />
          {availableStatuses.map((status) => (
            <Fragment key={status}>
              <FilterChip
                label={STATUS_BY_KEY[status]?.label ?? status}
                active={statusFilter.has(status)}
                onClick={() => onToggleStatus(status)}
              />
            </Fragment>
          ))}
        </LayoutGroup>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
          Has changes
        </span>
        <LayoutGroup id="irapp-has-changes-filters">
          <FilterChip
            label="All"
            active={hasChangesFilter.size === 0}
            onClick={onClearHasChanges}
          />
          {HAS_CHANGES_OPTIONS.map((value) => (
            <Fragment key={value}>
              <FilterChip
                label={value}
                active={hasChangesFilter.has(value)}
                onClick={() => onToggleHasChanges(value)}
              />
            </Fragment>
          ))}
        </LayoutGroup>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="ml-1 text-[11px] text-fg-subtle underline-offset-2 hover:text-fg-muted hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
