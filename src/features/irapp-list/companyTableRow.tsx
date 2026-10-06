import { PanelRightOpen, Pencil } from "lucide-react";
import type { companymasterapp, IRAppMasterColumnId } from "../../types";
import { normalizeHasChanges } from "../../lib/companyAppNormalize";
import { CommentsCell } from "./CommentsCell";
import { ContactsPopover } from "./ContactsPopover";
import { LinksPopover } from "./LinksPopover";
import { FeaturesPopover } from "./FeaturesPopover";
import { IconTooltip } from "./IconTooltip";
import { StatusPill } from "./StatusPill";
import { displayOrDash, EmptyValue } from "./EmptyValue";
import { MASTER_LIST_COLUMNS, STATUS_BY_KEY } from "./columnConfig";
import { HasChangesBadge } from "./cells/HasChangesBadge";
import { PillValue } from "./cells/PillValue";

interface IrappTableRowProps {
  app: companymasterapp;
  isColumnVisible: (id: IRAppMasterColumnId) => boolean;
  onSelect: (id: string) => void;
  onEdit: (app: companymasterapp) => void;
}

export function IrappTableRow({
  app,
  isColumnVisible,
  onSelect,
  onEdit,
}: IrappTableRowProps) {
  const hasChanges = normalizeHasChanges(app.hasChanges);

  return (
    <tr className="border-b border-border transition-colors hover:bg-white/[0.03]">
      {isColumnVisible("companyName") && (
        <td className={`px-3 py-3 align-top ${MASTER_LIST_COLUMNS[0].cellClass ?? ""}`}>
          <button
            type="button"
            onClick={() => onSelect(app.id)}
            className="group flex max-w-full items-start gap-2 text-left"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_BY_KEY[app.statusKey]?.dotClass ?? "bg-slate-500"}`}
            />
            <span className="text-sm font-semibold text-fg transition-colors group-hover:text-indigo-200">
              {app.companyName}
            </span>
          </button>
          {!isColumnVisible("country") && !isColumnVisible("market") && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {displayOrDash(app.country) && (
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-fg-subtle">
                  {app.country}
                </span>
              )}
              {displayOrDash(app.market) && (
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-fg-subtle">
                  {app.market}
                </span>
              )}
            </div>
          )}
        </td>
      )}

      {isColumnVisible("status") && (
        <td className="px-3 py-3 align-top">
          <StatusPill statusKey={app.statusKey} label={app.statusLabel} />
        </td>
      )}

      {isColumnVisible("liveVersion") && (
        <td className="px-3 py-3 align-top">
          <PillValue value={app.liveVersion} />
        </td>
      )}

      {isColumnVisible("upgradeOrNewOrder") && (
        <td className="px-3 py-3 align-top">
          <PillValue value={app.upgradeOrNewOrder} />
        </td>
      )}

      {isColumnVisible("initialReleaseDate") && (
        <td className="px-3 py-3 align-top font-mono text-[11px] text-fg-muted">
          {displayOrDash(app.initialReleaseDate) || <EmptyValue />}
        </td>
      )}

      {isColumnVisible("country") && (
        <td className="px-3 py-3 align-top text-xs text-fg-muted">
          {displayOrDash(app.country) || <EmptyValue />}
        </td>
      )}

      {isColumnVisible("market") && (
        <td className="px-3 py-3 align-top text-xs text-fg-muted">
          {displayOrDash(app.market) || <EmptyValue />}
        </td>
      )}

      {isColumnVisible("stockExchange") && (
        <td className="px-3 py-3 align-top text-xs text-fg-muted">
          {displayOrDash(app.stockExchange) || <EmptyValue />}
        </td>
      )}

      {isColumnVisible("hasChanges") && (
        <td className="px-3 py-3 align-top text-center">
          <HasChangesBadge value={hasChanges} />
        </td>
      )}

      {isColumnVisible("comments") && (
        <td
          className={`px-3 py-3 align-top ${MASTER_LIST_COLUMNS.find((c) => c.id === "comments")?.cellClass ?? ""}`}
        >
          <CommentsCell text={app.comments} />
        </td>
      )}

      {isColumnVisible("lastUpdated") && (
        <td className="px-3 py-3 align-top font-mono text-[11px] whitespace-nowrap text-fg-subtle">
          {app.lastUpdated}
        </td>
      )}

      {isColumnVisible("actions") && (
        <td className="px-3 py-3 align-top">
          <div className="flex items-center justify-center gap-1.5">
            <ContactsPopover
              sales={app.salesOnboardingPoc}
              pss={app.pssPoc}
              dev={app.devPoc}
              compact
            />
            <LinksPopover app={app} />
            <FeaturesPopover app={app} />
            <IconTooltip label="Edit client">
              <button
                type="button"
                onClick={() => onEdit(app)}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-white/5 p-1.5 text-fg-muted transition-colors hover:border-border-strong hover:bg-white/10 hover:text-fg"
                aria-label={`Edit ${app.companyName}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </IconTooltip>
            <IconTooltip label="Open full details">
              <button
                type="button"
                onClick={() => onSelect(app.id)}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-white/5 p-1.5 text-fg-muted transition-colors hover:border-border-strong hover:bg-white/10 hover:text-fg"
                aria-label={`Open details for ${app.companyName}`}
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
              </button>
            </IconTooltip>
          </div>
        </td>
      )}
    </tr>
  );
}
