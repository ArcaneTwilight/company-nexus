import type { FeatureFlagValue, companymasterapp } from "../../types";

/** Icon / indicator key for flag-style features. */
export type FeatureFlagKind = "accountFeature" | "media" | "aiFeatures";

export interface FlagFeatureDefinition {
  id: string;
  label: string;
  tooltip: string;
  kind: "flag";
  flagKind: FeatureFlagKind;
  getValue: (app: companymasterapp) => FeatureFlagValue;
}

export interface TextFeatureDefinition {
  id: string;
  label: string;
  tooltip: string;
  kind: "text";
  getValue: (app: companymasterapp) => string;
}

export type AppFeatureDefinition = FlagFeatureDefinition | TextFeatureDefinition;

/**
 * Canonical list of Company features shown in the Features action table.
 * Add new entries here as features are introduced — no table columns needed.
 */
export const APP_FEATURES: AppFeatureDefinition[] = [
  {
    id: "media",
    label: "Media",
    tooltip: "App includes media modules (galleries, videos, etc.)",
    kind: "flag",
    flagKind: "media",
    getValue: (app) => app.media,
  },
  {
    id: "aiFeatures",
    label: "AI Features",
    tooltip: "App includes AI-powered features",
    kind: "flag",
    flagKind: "aiFeatures",
    getValue: (app) => app.aiFeatures,
  },
  {
    id: "pushNotification",
    label: "Push Notification",
    tooltip: "Push notification availability",
    kind: "text",
    getValue: (app) => app.pushNotification,
  },
];
