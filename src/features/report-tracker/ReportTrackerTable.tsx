import { Pencil } from "lucide-react";
import type { companymasterapp, ReportTrackerEntry } from "../../types";
import { CompletedBadge, StatusToggle } from "./StatusCell";

interface ReportTrackerTableProps {
  entries: ReportTrackerEntry[];
  appsById: Map<string, companymasterapp>;
  onEditEntry: (entry: ReportTrackerEntry) => void;
  onUpdateEntry: (entry: ReportTrackerEntry) => void;
}

const REPORT_COLUMNS = [
  { id: "financialReports", label: "Financial Reports" },
  { id: "annualReports", label: "Annual Reports" },
  { id: "esgReports", label: "ESG Reports" },
] as const;

export function ReportTrackerTable({
  entries,
  appsById,
  onEditEntry,
  onUpdateEntry,
}: ReportTrackerTableProps) {
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
              {REPORT_COLUMNS.map((column) => (
                <th
                  key={column.id}
                  className="px-3 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-fg-subtle"
                >
                  {column.label}
                </th>
              ))}
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
              const isComplete =
                entry.financialReports === true &&
                entry.annualReports === true &&
                entry.esgReports === true;

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
                  {REPORT_COLUMNS.map((column) => (
                    <td key={column.id} className="px-3 py-2.5 text-center">
                      <div className="flex justify-center">
                        <StatusToggle
                          value={entry[column.id]}
                          label={`${column.label} for ${entry.appName}`}
                          onChange={(value) =>
                            onUpdateEntry({
                              ...entry,
                              [column.id]: value,
                            })
                          }
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center">
                    <CompletedBadge completed={isComplete} />
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
