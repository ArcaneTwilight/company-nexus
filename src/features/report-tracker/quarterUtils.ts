import type {
  AnnualReportStatus,
  companymasterapp,
  OtherReportItem,
  QuarterReportStatus,
  ReportQuarterView,
  ReportTrackerEntry,
} from "../../types";
import type { ReportTrackerSeedEntry } from "../../data/reportTrackerSeed";

export const REPORT_YEARS = [2025, 2026] as const;

export const QUARTER_TABS: ReportQuarterView[] = ["Q1", "Q2", "Q3", "Q4", "annual"];

export const QUARTER_REPORT_COLUMNS = [
  { id: "fr", label: "Financial Reports" },
  { id: "ip", label: "Presentations" },
] as const;

export type QuarterReportFieldId = (typeof QUARTER_REPORT_COLUMNS)[number]["id"];

export const STORAGE_KEY = "nexus_report_tracker";

export function getCurrentQuarter(): ReportQuarterView {
  const month = new Date().getMonth();
  if (month <= 2) return "Q1";
  if (month <= 5) return "Q2";
  if (month <= 8) return "Q3";
  return "Q4";
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getPreviousQuarter(): {
  year: number;
  quarter: Exclude<ReportQuarterView, "annual">;
} {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const previousQuarter = (currentQuarter + 3) % 4;
  return {
    year: currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear(),
    quarter: (["Q1", "Q2", "Q3", "Q4"] as const)[previousQuarter],
  };
}

export function quarterKey(year: number, quarter: ReportQuarterView): string {
  if (quarter === "annual") return String(year);
  return `${year}-${quarter}`;
}

/** Annual column year is the prior fiscal year label in the spreadsheet. */
export function annualYearForView(year: number): number {
  return year - 1;
}

export function emptyQuarterStatus(): QuarterReportStatus {
  return {
    fr: null,
    ip: null,
    others: [],
    completed: false,
  };
}

export function emptyAnnualStatus(): AnnualReportStatus {
  return { ar: null, sr: null, others: [] };
}

export function parseOtherItems(
  raw: string | OtherReportItem[] | undefined,
  uploadedDefault = false
): OtherReportItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item, index) => ({
      id: item.id || `other-${index}-${item.label}`,
      label: item.label,
      uploaded: Boolean(item.uploaded),
    }));
  }
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label, index) => ({
      id: `other-${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      label,
      uploaded: uploadedDefault,
    }));
}

export function hydrateSeedEntry(seed: ReportTrackerSeedEntry): ReportTrackerEntry {
  const quarters: ReportTrackerEntry["quarters"] = {};
  for (const [key, status] of Object.entries(seed.quarters)) {
    quarters[key] = {
      ...status,
      others: parseOtherItems(status.others, status.completed),
    };
  }
  const annual: ReportTrackerEntry["annual"] = {};
  for (const [key, status] of Object.entries(seed.annual)) {
    annual[key] = {
      ...status,
      others: parseOtherItems(status.others, status.ar === true),
    };
  }
  return {
    id: seed.id,
    appName: seed.appName,
    companyCode: seed.companyCode,
    stockExchange: seed.stockExchange,
    irappClientId: seed.irappClientId,
    financialReports: seed.financialReports,
    annualReports: seed.annualReports,
    esgReports: seed.esgReports,
    quarters,
    annual,
    financialCalendar: seed.financialCalendar,
    docLib: seed.docLib,
  };
}

export function getQuarterStatus(
  entry: ReportTrackerEntry,
  year: number,
  quarter: Exclude<ReportQuarterView, "annual">
): QuarterReportStatus {
  return entry.quarters[quarterKey(year, quarter)] ?? emptyQuarterStatus();
}

export function getAnnualStatus(
  entry: ReportTrackerEntry,
  year: number
): AnnualReportStatus {
  return entry.annual[String(annualYearForView(year))] ?? emptyAnnualStatus();
}

function areStandardFieldsDone(values: Array<boolean | null>): boolean {
  const applicable = values.filter((value) => value !== null);
  if (applicable.length === 0) return true;
  return applicable.every((value) => value === true);
}

function areOthersDone(others: OtherReportItem[]): boolean {
  if (others.length === 0) return true;
  return others.every((item) => item.uploaded);
}

/** Derive completed from field + Others upload state. */
export function deriveQuarterCompleted(status: QuarterReportStatus): boolean {
  const fieldsDone = areStandardFieldsDone([status.fr, status.ip]);
  const othersDone = areOthersDone(status.others);
  const hasTracked = status.fr !== null || status.ip !== null || status.others.length > 0;
  if (!hasTracked) return false;
  return fieldsDone && othersDone;
}

export function deriveAnnualCompleted(status: AnnualReportStatus): boolean {
  const fieldsDone = areStandardFieldsDone([status.ar, status.sr]);
  const othersDone = areOthersDone(status.others);
  const hasTracked =
    status.ar !== null || status.sr !== null || status.others.length > 0;
  if (!hasTracked) return false;
  return fieldsDone && othersDone;
}

export function withDerivedQuarterCompleted(
  status: QuarterReportStatus
): QuarterReportStatus {
  return { ...status, completed: deriveQuarterCompleted(status) };
}

export function isEntryCompletedForView(
  entry: ReportTrackerEntry,
  year: number,
  view: ReportQuarterView
): boolean {
  if (view === "annual") {
    return deriveAnnualCompleted(getAnnualStatus(entry, year));
  }
  return deriveQuarterCompleted(getQuarterStatus(entry, year, view));
}

export interface ReportTrackerStats {
  total: number;
  completed: number;
  linked: number;
  percentage: number;
}

export function computeStats(
  entries: ReportTrackerEntry[],
  year: number,
  view: ReportQuarterView
): ReportTrackerStats {
  const total = entries.length;
  const completed = entries.filter((e) =>
    isEntryCompletedForView(e, year, view)
  ).length;
  const linked = entries.filter((e) => Boolean(e.irappClientId)).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, linked, percentage };
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
}

/** Create a blank tracker row linked to a newly added Company client. */
export function createEntryFromApp(app: companymasterapp): ReportTrackerEntry {
  const year = getCurrentYear();
  const quarters: ReportTrackerEntry["quarters"] = {};
  for (const q of ["Q1", "Q2", "Q3", "Q4"] as const) {
    quarters[`${year}-${q}`] = emptyQuarterStatus();
  }
  return {
    id: `rt-${slugify(app.companyName)}-${app.id.slice(-6)}`,
    appName: app.companyName,
    companyCode: "",
    stockExchange: app.stockExchange || "",
    irappClientId: app.id,
    financialReports: false,
    annualReports: false,
    esgReports: false,
    quarters,
    annual: {
      [String(year - 1)]: emptyAnnualStatus(),
    },
    financialCalendar: false,
    docLib: false,
  };
}

/** Normalize a persisted/Firestore document into a full ReportTrackerEntry. */
export function normalizeReportTrackerEntry(
  raw: Partial<ReportTrackerEntry> & { id: string }
): ReportTrackerEntry {
  const quarters: ReportTrackerEntry["quarters"] = {};
  for (const [key, status] of Object.entries(raw.quarters ?? {})) {
    quarters[key] = withDerivedQuarterCompleted({
      ...emptyQuarterStatus(),
      ...status,
      others: parseOtherItems(
        status?.others as unknown as string | OtherReportItem[] | undefined
      ),
    });
  }
  const annual: ReportTrackerEntry["annual"] = {};
  for (const [key, status] of Object.entries(raw.annual ?? {})) {
    annual[key] = {
      ...emptyAnnualStatus(),
      ...status,
      others: parseOtherItems(
        status?.others as unknown as string | OtherReportItem[] | undefined
      ),
    };
  }
  return {
    id: raw.id,
    appName: raw.appName ?? "",
    companyCode: raw.companyCode ?? "",
    stockExchange: raw.stockExchange ?? "",
    ...(raw.irappClientId ? { irappClientId: raw.irappClientId } : {}),
    financialReports:
      raw.financialReports === null ? null : Boolean(raw.financialReports),
    annualReports:
      raw.annualReports === null ? null : Boolean(raw.annualReports),
    esgReports: raw.esgReports === null ? null : Boolean(raw.esgReports),
    quarters,
    annual,
    financialCalendar: Boolean(raw.financialCalendar),
    docLib: Boolean(raw.docLib),
  };
}

export function normalizeReportTrackerEntries(
  entries: Array<Partial<ReportTrackerEntry> & { id: string }>
): ReportTrackerEntry[] {
  return entries
    .map(normalizeReportTrackerEntry)
    .sort((a, b) =>
      a.appName.localeCompare(b.appName, undefined, { sensitivity: "base" })
    );
}

/** Drop undefined fields so Firestore setDoc does not reject the payload. */
export function sanitizeReportTrackerEntry(
  entry: ReportTrackerEntry
): ReportTrackerEntry {
  return JSON.parse(JSON.stringify(entry)) as ReportTrackerEntry;
}

export function loadStoredEntries(): ReportTrackerEntry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Array<Partial<ReportTrackerEntry> & { id: string }>;
    if (!Array.isArray(parsed)) return null;
    return normalizeReportTrackerEntries(parsed);
  } catch {
    return null;
  }
}

export function saveStoredEntries(entries: ReportTrackerEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
}
