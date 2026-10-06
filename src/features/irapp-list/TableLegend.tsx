import { CircleHelp } from "lucide-react";
import { FEATURE_LEGEND, STATUS_LEGEND } from "./columnConfig";
import { IconTooltip } from "./IconTooltip";
import { Popover } from "./Popover";

export function TableLegend() {
  return (
    <Popover
      title="Legends"
      align="right"
      trigger={
        <IconTooltip label="Status & feature legend">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-white/5 px-2.5 py-1.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:bg-white/10">
            <CircleHelp className="h-3.5 w-3.5 text-fg-muted" />
            Legend
          </span>
        </IconTooltip>
      }
      panelClassName="min-w-[18rem] max-w-[22rem]"
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
            Status pills
          </p>
          <ul className="space-y-1.5">
            {STATUS_LEGEND.filter((item) => item.key !== "unknown").map((item) => (
              <li key={item.key} className="flex items-start gap-2 text-xs text-fg-muted">
                <span
                  className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-mono uppercase ${item.pillClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${item.dotClass}`} />
                  {item.label}
                </span>
                <span className="text-[11px] text-fg-subtle">{item.tooltip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
            Features (Actions → Features)
          </p>
          <ul className="space-y-1.5">
            {FEATURE_LEGEND.map((item) => (
              <li key={item.id} className="text-[11px] text-fg-muted">
                <span className="font-medium text-fg-muted">{item.label}</span>
                {" — "}
                {item.tooltip}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-fg-subtle">
            Flag icons: ✓ Yes · − No · icon = partial · ? unknown
          </p>
        </div>
      </div>
    </Popover>
  );
}
