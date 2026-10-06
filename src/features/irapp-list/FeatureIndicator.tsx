import { Check, Minus, Sparkles, Image, UserRound, CircleHelp } from "lucide-react";
import type { FeatureFlagValue, FeatureTriState } from "../../types";
import { FEATURE_TOOLTIPS } from "./columnConfig";
import { IconTooltip } from "./IconTooltip";

interface FeatureIndicatorProps {
  kind: "accountFeature" | "media" | "aiFeatures";
  feature: FeatureFlagValue;
}

const KIND_ICONS = {
  accountFeature: UserRound,
  media: Image,
  aiFeatures: Sparkles,
} as const;

const KIND_LABELS = {
  accountFeature: "Account Feature",
  media: "Media",
  aiFeatures: "AI Features",
} as const;

function stateClasses(value: FeatureTriState) {
  switch (value) {
    case "yes":
      return "text-emerald-700 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-300";
    case "no":
      return "text-fg-subtle bg-slate-500/10 border-slate-500/20";
    case "partial":
      return "text-amber-700 bg-amber-500/10 border-amber-500/25 dark:text-amber-300";
    default:
      return "text-fg-subtle bg-slate-500/5 border-slate-500/15";
  }
}

export function FeatureIndicator({ kind, feature }: FeatureIndicatorProps) {
  const safeFeature = feature ?? { value: "unknown" as const, label: "" };
  const KindIcon = KIND_ICONS[kind];
  const stateLabel = safeFeature.label || FEATURE_TOOLTIPS[safeFeature.value];
  const tip = `${KIND_LABELS[kind]}: ${stateLabel}`;

  return (
    <IconTooltip label={tip}>
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${stateClasses(safeFeature.value)}`}
        aria-label={tip}
      >
        {safeFeature.value === "yes" ? (
          <Check className="h-3.5 w-3.5" />
        ) : safeFeature.value === "no" ? (
          <Minus className="h-3.5 w-3.5" />
        ) : safeFeature.value === "partial" ? (
          <KindIcon className="h-3.5 w-3.5" />
        ) : (
          <CircleHelp className="h-3.5 w-3.5" />
        )}
      </span>
    </IconTooltip>
  );
}
