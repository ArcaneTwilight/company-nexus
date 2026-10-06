import type { companymasterapp, IRAppMasterStatusKey } from "../types";

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

const DEFAULT_STATUS_LABELS: Record<IRAppMasterStatusKey, string> = {
  online: "Online",
  for_production: "For Release",
  client_testing: "Client Testing",
  on_development: "On Development",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  new: "New Order",
  rejected: "Rejected / Removed",
  unknown: "Unknown",
};

/** Build a new master-list row with required defaults for create flows. */
export function createBlankcompanyApp(
  companyName: string,
  country: string,
  options?: {
    statusKey?: IRAppMasterStatusKey;
    market?: string;
  }
): companymasterapp {
  const name = companyName.trim();
  const statusKey = options?.statusKey ?? "new";

  return {
    id: `app-${Date.now()}-${slugify(name) || "client"}`,
    companyName: name,
    statusKey,
    statusLabel: DEFAULT_STATUS_LABELS[statusKey],
    liveVersion: "",
    upgradeOrNewOrder: "New",
    v3Release: "",
    v3ReleaseRaw: "",
    initialReleaseDate: "",
    initialReleaseDateRaw: "",
    dateOrdered: todayIsoDate(),
    daysCompleted: "",
    ongoingV2Production: "",
    iosDownloads: "",
    androidDownloads: "",
    pushNotification: "",
    deleteAccountFeature: "",
    accountFeature: { value: "yes", label: "Yes" },
    media: { value: "unknown", label: "" },
    aiFeatures: { value: "unknown", label: "" },
    initialIosRelease: "",
    initialAndroidRelease: "",
    dateField: "",
    comments: "",
    hasChanges: "No",
    salesOnboardingPoc: [],
    salesOnboardingPocRaw: "",
    pssPoc: [],
    devPoc: [],
    country: country.trim(),
    market: options?.market?.trim() ?? "",
    stockExchange: "",
    dynamicContent: "",
    manualUpdateModule: "",
    marketingMaterial: [],
    marketingMaterialRaw: "",
    androidClosedTesting: [],
    androidClosedTestingRaw: "",
    androidInternalTesting: [],
    androidInternalTestingRaw: "",
    lastUpdated: todayIsoDate(),
  };
}

export function parseContactList(raw: string): string[] {
  return raw
    .split(/[/&,]| and /i)
    .map((part) => part.trim())
    .filter(Boolean);
}
