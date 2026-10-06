import type {
  FeatureTriState,
  IRAppMasterColumnId,
  IRAppMasterStatusKey,
} from "../../types";
import { APP_FEATURES } from "./appFeatures";

export interface StatusLegendItem {
  key: IRAppMasterStatusKey;
  label: string;
  tooltip: string;
  pillClass: string;
  dotClass: string;
}

export interface FeatureLegendItem {
  id: string;
  label: string;
  tooltip: string;
}

export interface ColumnDefinition {
  id: IRAppMasterColumnId;
  label: string;
  /** Short header hint for icon/info tooltips */
  headerTooltip?: string;
  /** Tailwind visibility classes for responsive hiding */
  visibilityClass: string;
  /** Prefer min width for comments / company */
  cellClass?: string;
  align?: "left" | "center";
}

export const DEFAULT_LAST_UPDATED = "2026-07-08";

export const STATUS_LEGEND: StatusLegendItem[] = [
  {
    key: "online",
    label: "Online",
    tooltip: "App is live in production stores",
    pillClass: "text-emerald-800 bg-emerald-500/15 border-emerald-500/30 dark:text-emerald-300",
    dotClass: "bg-emerald-400",
  },
  {
    key: "for_production",
    label: "For Release",
    tooltip: "Ready or queued for production release",
    pillClass: "text-emerald-800 bg-emerald-500/15 border-emerald-500/30 dark:text-emerald-300",
    dotClass: "bg-emerald-400",
  },
  {
    key: "client_testing",
    label: "Client Testing",
    tooltip: "With client for QA / UAT or waiting for release",
    pillClass: "text-sky-800 bg-sky-500/15 border-sky-500/30 dark:text-sky-300",
    dotClass: "bg-sky-400",
  },
  {
    key: "on_development",
    label: "On Development",
    tooltip: "Actively being built or upgraded",
    pillClass: "text-violet-800 bg-violet-500/15 border-violet-500/30 dark:text-violet-300",
    dotClass: "bg-violet-400",
  },
  {
    key: "on_hold",
    label: "On Hold",
    tooltip: "Paused pending client or internal decision",
    pillClass: "text-amber-800 bg-amber-500/15 border-amber-500/30 dark:text-amber-300",
    dotClass: "bg-amber-400",
  },
  {
    key: "new",
    label: "New Order",
    tooltip: "Newly ordered app or upgrade",
    pillClass: "text-cyan-800 bg-cyan-500/15 border-cyan-500/30 dark:text-cyan-300",
    dotClass: "bg-cyan-400",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    tooltip: "Project cancelled — retained for history",
    pillClass: "text-rose-800 bg-rose-500/10 border-rose-500/25 dark:text-rose-300",
    dotClass: "bg-rose-400/80",
  },
  {
    key: "rejected",
    label: "Rejected / Removed",
    tooltip: "Rejected or removed from stores",
    pillClass: "text-fg-muted bg-slate-500/10 border-slate-500/25",
    dotClass: "bg-slate-500",
  },
  {
    key: "unknown",
    label: "Unknown",
    tooltip: "Status could not be normalized from source",
    pillClass: "text-fg-muted bg-slate-500/10 border-slate-500/20",
    dotClass: "bg-slate-500",
  },
];

export const STATUS_BY_KEY = Object.fromEntries(
  STATUS_LEGEND.map((item) => [item.key, item])
) as Record<IRAppMasterStatusKey, StatusLegendItem>;

export const FEATURE_LEGEND: FeatureLegendItem[] = APP_FEATURES.map((feature) => ({
  id: feature.id,
  label: feature.label,
  tooltip: feature.tooltip,
}));

export const FEATURE_TOOLTIPS: Record<FeatureTriState, string> = {
  yes: "Enabled / Yes",
  no: "Not enabled / No",
  partial: "Partially enabled (platform-specific)",
  unknown: "Not specified in master list",
};

/**
 * Default visible column order for the operational master-list table.
 * Hidden fields (POCs, links) live in popovers / the detail drawer.
 */
export const MASTER_LIST_COLUMNS: ColumnDefinition[] = [
  {
    id: "companyName",
    label: "Company Name",
    headerTooltip: "Click to open full app details",
    visibilityClass: "",
    cellClass: "min-w-[9.5rem] max-w-[14rem]",
  },
  {
    id: "status",
    label: "Status",
    headerTooltip: "Operational status of the Company",
    visibilityClass: "",
  },
  {
    id: "liveVersion",
    label: "Live version",
    headerTooltip: "Currently live app version family",
    visibilityClass: "hidden sm:table-cell",
  },
  {
    id: "upgradeOrNewOrder",
    label: "Upgrade / New Order",
    headerTooltip: "Whether this is a new order or an upgrade path",
    visibilityClass: "hidden md:table-cell",
  },
  {
    id: "initialReleaseDate",
    label: "Initial Release Date",
    headerTooltip: "First production release date",
    visibilityClass: "hidden xl:table-cell",
  },
  {
    id: "country",
    label: "Country",
    visibilityClass: "hidden 2xl:table-cell",
  },
  {
    id: "market",
    label: "Market",
    visibilityClass: "hidden 2xl:table-cell",
  },
  {
    id: "stockExchange",
    label: "Stock Exchange",
    visibilityClass: "hidden 2xl:table-cell",
  },
  {
    id: "hasChanges",
    label: "Has changes",
    headerTooltip: "Whether this app has pending or in-flight changes (Yes / No only)",
    visibilityClass: "",
    align: "center",
  },
  {
    id: "comments",
    label: "Comments / Remarks",
    headerTooltip: "Quick operational summary — what is pending or happening",
    visibilityClass: "",
    cellClass: "min-w-[12rem] max-w-[22rem] w-[22%]",
  },
  {
    id: "lastUpdated",
    label: "Last Updated",
    visibilityClass: "hidden md:table-cell",
  },
  {
    id: "actions",
    label: "Actions",
    headerTooltip: "Open details, contacts, links, and features",
    visibilityClass: "",
    align: "center",
  },
];
