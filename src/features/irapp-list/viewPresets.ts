import type {
  HasChangesValue,
  IRAppMasterColumnId,
  IRAppMasterStatusKey,
} from "../../types";

export type SavedViewId =
  | "compact"
  | "online"
  | "testing"
  | "has_changes"
  | "for_release";

export type SortColumnId =
  | "companyName"
  | "initialReleaseDate"
  | "lastUpdated";

export type SortDirection = "asc" | "desc";

export interface SortState {
  column: SortColumnId;
  direction: SortDirection;
}

export interface ViewPreset {
  id: SavedViewId;
  label: string;
  description: string;
  /** null = no status restriction (all statuses) */
  statusKeys: IRAppMasterStatusKey[] | null;
  /** null = no has-changes restriction */
  hasChanges: HasChangesValue | null;
  visibleColumns: IRAppMasterColumnId[];
}

/** Columns that stay visible in every view and cannot be hidden. */
export const LOCKED_VISIBLE_COLUMNS: IRAppMasterColumnId[] = [
  "companyName",
  "comments",
  "actions",
];

/** Default Compact landing columns — Comments / Remarks always included. */
export const COMPACT_VISIBLE_COLUMNS: IRAppMasterColumnId[] = [
  "companyName",
  "status",
  "liveVersion",
  "hasChanges",
  "comments",
  "actions",
];

export const DEFAULT_VIEW_ID: SavedViewId = "compact";

export const DEFAULT_SORT: SortState = {
  column: "companyName",
  direction: "asc",
};

/**
 * Saved view presets. Switching a view applies its filter + column baselines;
 * manual filter / column tweaks layer on top without wiping each other.
 * "Attention needed" is intentionally not included.
 */
export const VIEW_PRESETS: ViewPreset[] = [
  {
    id: "compact",
    label: "Compact view",
    description: "Essential columns only — default landing view",
    statusKeys: null,
    hasChanges: null,
    visibleColumns: COMPACT_VISIBLE_COLUMNS,
  },
  {
    id: "online",
    label: "Online apps",
    description: "Apps currently live in production stores",
    statusKeys: ["online"],
    hasChanges: null,
    visibleColumns: [
      ...COMPACT_VISIBLE_COLUMNS,
      "country",
      "market",
      "lastUpdated",
    ],
  },
  {
    id: "testing",
    label: "Client Testing",
    description: "Client testing and apps waiting for release",
    statusKeys: ["client_testing", "on_development"],
    hasChanges: null,
    visibleColumns: [
      ...COMPACT_VISIBLE_COLUMNS,
      "upgradeOrNewOrder",
      "lastUpdated",
    ],
  },
  {
    id: "has_changes",
    label: "Has changes",
    description: "Apps marked as having changes (Yes)",
    statusKeys: null,
    hasChanges: "Yes",
    visibleColumns: [
      ...COMPACT_VISIBLE_COLUMNS,
      "upgradeOrNewOrder",
      "lastUpdated",
    ],
  },
  {
    id: "for_release",
    label: "For Release",
    description: "Apps queued for release",
    statusKeys: ["for_production"],
    hasChanges: null,
    visibleColumns: [
      ...COMPACT_VISIBLE_COLUMNS,
      "upgradeOrNewOrder",
      "initialReleaseDate",
      "lastUpdated",
    ],
  },
];

export const VIEW_PRESET_BY_ID = Object.fromEntries(
  VIEW_PRESETS.map((preset) => [preset.id, preset])
) as Record<SavedViewId, ViewPreset>;

export const SORTABLE_COLUMNS = new Set<IRAppMasterColumnId>([
  "companyName",
  "initialReleaseDate",
  "lastUpdated",
]);

export function getPresetVisibleSet(preset: ViewPreset): Set<IRAppMasterColumnId> {
  return new Set([...LOCKED_VISIBLE_COLUMNS, ...preset.visibleColumns]);
}
