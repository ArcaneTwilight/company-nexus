import { Pencil } from "lucide-react";
import type { companymasterapp, ProductionTrackerEntry } from "../../types";
import { phaseBadgeClass, priorityBadgeClass } from "./constants";

interface ProductionTrackerTableProps {
  entries: ProductionTrackerEntry[];
  appsById: Map<string, companymasterapp>;
  onEditEntry: (entry: ProductionTrackerEntry) => void;
}

export function ProductionTrackerTable({
  entries,
  appsById,
  onEditEntry,
}: ProductionTrackerTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-panel-solid">
              <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Client
              </th>
              <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Priority
              </th>
              <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Assigned Dev
              </th>
              <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                App Support
              </th>
              <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Current Phase
              </th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const linked = entry.companyAppId
                ? appsById.get(entry.companyAppId)
                : undefined;
              return (
                <tr
                  key={entry.id}
                  className="border-b border-border/60 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">
                        {entry.clientName}
                      </p>
                      {linked && (
                        <p className="mt-0.5 truncate text-[11px] text-fg-subtle">
                          {linked.companyName}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${priorityBadgeClass(entry.priority)}`}
                    >
                      {entry.priority || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-fg-muted">
                    {entry.assignedDev || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-fg-muted">
                    {entry.assignedPss || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${phaseBadgeClass(entry.currentPhase)}`}
                    >
                      {entry.currentPhase || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <button
                      type="button"
                      onClick={() => onEditEntry(entry)}
                      className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-white/5 hover:text-fg"
                      aria-label={`Edit ${entry.clientName}`}
                      title="Edit"
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
