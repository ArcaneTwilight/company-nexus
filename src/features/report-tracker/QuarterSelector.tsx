import { FilterChip } from "../../components/motion";
import type { ReportQuarterView } from "../../types";
import { QUARTER_TABS, REPORT_YEARS } from "./quarterUtils";

interface QuarterSelectorProps {
  year: number;
  view: ReportQuarterView;
  onYearChange: (year: number) => void;
  onViewChange: (view: ReportQuarterView) => void;
}

export function QuarterSelector({
  year,
  view,
  onYearChange,
  onViewChange,
}: QuarterSelectorProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <label
          htmlFor="report-year"
          className="text-[11px] font-mono uppercase tracking-wider text-fg-subtle"
        >
          Year
        </label>
        <select
          id="report-year"
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
          className="rounded-lg border border-border bg-panel-solid px-3 py-1.5 text-sm text-fg outline-none transition-colors hover:border-border-strong focus:border-sky-500/50"
        >
          {REPORT_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {QUARTER_TABS.map((tab) => (
          <FilterChip
            key={tab}
            label={tab === "annual" ? "Annual" : tab}
            active={view === tab}
            onClick={() => onViewChange(tab)}
          />
        ))}
      </div>
    </div>
  );
}
