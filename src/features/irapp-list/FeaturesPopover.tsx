import { LayoutGrid } from "lucide-react";
import type { companymasterapp } from "../../types";
import { APP_FEATURES } from "./appFeatures";
import { FeatureIndicator } from "./FeatureIndicator";
import { EmptyValue, displayOrDash } from "./EmptyValue";
import { IconTooltip } from "./IconTooltip";
import { Popover } from "./Popover";

interface FeaturesPopoverProps {
  app: companymasterapp;
}

export function FeaturesPopover({ app }: FeaturesPopoverProps) {
  return (
    <Popover
      title="Features"
      panelClassName="min-w-[18rem] max-w-[24rem]"
      trigger={
        <IconTooltip label="App features">
          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-white/5 px-1.5 py-1 text-fg-muted transition-colors hover:border-border-strong hover:bg-white/10">
            <LayoutGrid className="h-3.5 w-3.5" />
          </span>
        </IconTooltip>
      }
    >
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-white/[0.03]">
              <th className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Feature
              </th>
              <th className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {APP_FEATURES.map((feature) => (
              <tr
                key={feature.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-2.5 py-2 align-middle">
                  <IconTooltip label={feature.tooltip}>
                    <span className="text-xs text-fg-muted">{feature.label}</span>
                  </IconTooltip>
                </td>
                <td className="px-2.5 py-2 align-middle">
                  {feature.kind === "flag" ? (
                    <FeatureIndicator
                      kind={feature.flagKind}
                      feature={feature.getValue(app)}
                    />
                  ) : (
                    <span className="text-[11px] text-fg-muted">
                      {displayOrDash(feature.getValue(app)) || <EmptyValue />}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Popover>
  );
}
