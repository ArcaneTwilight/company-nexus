import { Pencil } from "lucide-react";
import type {
  OtherReportItem,
  ReportQuarterView,
  ReportTrackerEntry,
  companymasterapp,
} from "../../types";
import {
  QUARTER_REPORT_COLUMNS,
  annualYearForView,
  deriveAnnualCompleted,
  deriveQuarterCompleted,
  getAnnualStatus,
  getQuarterStatus,
  quarterKey,
  withDerivedQuarterCompleted,
} from "./quarterUtils";
import { CompletedBadge, OthersSummary, StatusToggle } from "./StatusCell";

interface ReportTrackerTableProps {
  entries: ReportTrackerEntry[];
  appsById: Map<string, companymasterapp>;
  year: number;
  view: ReportQuarterView;
  onEditEntry: (entry: ReportTrackerEntry) => void;
  onEditOthers: (
    entry: ReportTrackerEntry,
    year: number,
    view: ReportQuarterView
  ) => void;
  onUpdateEntry: (entry: ReportTrackerEntry) => void;
}

const ANNUAL_REPORT_COLUMNS = [
  { id: "ar", label: "Annual Report" },
  { id: "sr", label: "Sustainability Report" },
] as const;

export function ReportTrackerTable({
  entries,
  appsById,
  year,
  view,
  onEditEntry,
  onEditOthers,
  onUpdateEntry,
}: ReportTrackerTableProps) {
  const quarter = view === "annual" ? null : view;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-panel-solid">
              <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Company
              </th>
              <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Country
              </th>
              {view === "annual"
                ? ANNUAL_REPORT_COLUMNS.map((column) => (
                    <th
                      key={column.id}
                      className="px-3 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-fg-subtle"
                    >
                      {column.label}
                    </th>
                  ))
                : QUARTER_REPORT_COLUMNS.map((column) => (
                    <th
                      key={column.id}
                      className="px-3 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-fg-subtle"
                    >
                      {column.label}
                    </th>
                  ))}
              <th className="px-3 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Other reports
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Status
              </th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const linkedApp = entry.irappClientId
                ? appsById.get(entry.irappClientId)
                : undefined;
              const quarterStatus = quarter
                ? getQuarterStatus(entry, year, quarter)
                : null;
              const annualStatus =
                view === "annual" ? getAnnualStatus(entry, year) : null;
              const others: OtherReportItem[] =
                annualStatus?.others ?? quarterStatus?.others ?? [];
              const completed = annualStatus
                ? deriveAnnualCompleted(annualStatus)
                : quarterStatus
                  ? deriveQuarterCompleted(quarterStatus)
                  : false;

              return (
                <tr
                  key={entry.id}
                  className="border-b border-border/60 transition-colors hover:bg-panel-solid/60"
                >
                  <td className="px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-fg">
                      {linkedApp?.companyName || entry.appName}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-fg-muted">
                    {linkedApp?.country || "—"}
                  </td>
                  {view === "annual" && annualStatus
                    ? ANNUAL_REPORT_COLUMNS.map((column) => (
                        <td
                          key={column.id}
                          className="px-3 py-2.5 text-center"
                        >
                          <div className="flex justify-center">
                            <StatusToggle
                              value={annualStatus[column.id]}
                              label={`${column.label} for ${entry.appName}`}
                              onChange={(value) => {
                                const nextStatus = {
                                  ...annualStatus,
                                  [column.id]: value,
                                };
                                const key = String(annualYearForView(year));
                                onUpdateEntry({
                                  ...entry,
                                  annual: { ...entry.annual, [key]: nextStatus },
                                });
                              }}
                            />
                          </div>
                        </td>
                      ))
                    : quarterStatus &&
                      QUARTER_REPORT_COLUMNS.map((column) => (
                        <td
                          key={column.id}
                          className="px-3 py-2.5 text-center"
                        >
                          <div className="flex justify-center">
                            <StatusToggle
                              value={quarterStatus[column.id]}
                              label={`${column.label} for ${entry.appName}`}
                              onChange={(value) => {
                                const nextStatus = withDerivedQuarterCompleted({
                                  ...quarterStatus,
                                  [column.id]: value,
                                });
                                const key = quarterKey(year, view);
                                onUpdateEntry({
                                  ...entry,
                                  quarters: {
                                    ...entry.quarters,
                                    [key]: nextStatus,
                                  },
                                });
                              }}
                            />
                          </div>
                        </td>
                      ))}
                  <td className="px-3 py-2.5 text-center">
                    <OthersSummary
                      items={others}
                      onClick={() => onEditOthers(entry, year, view)}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <CompletedBadge completed={completed} />
                  </td>
                  <td className="px-2 py-2.5">
                    <button
                      type="button"
                      title="Edit entry"
                      aria-label={`Edit ${entry.appName}`}
                      onClick={() => onEditEntry(entry)}
                      className="inline-flex rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-panel hover:text-fg"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
