import type { companymasterapp, ReportTrackerEntry } from "../../types";

/** Explicit aliases when heuristic matching fails */
const APP_NAME_ALIASES: Record<string, string[]> = {
  "e& (etisalat)": ["e& (etisalat and)", "e&", "etisalat"],
  "oreedo": ["ooredoo", "ooreedo"],
  "ooreedo": ["ooredoo"],
  "emobility (edcad)": [
    "emirates mobility company",
    "emirate mobility company",
    "emobility",
    "edcad",
  ],
  emobility: ["emirates mobility company", "emirate mobility company"],
  "saudi energy": ["saudi electricity", "sec"],
  "solutions by stc": ["solutions", "stc solutions"],
  "bsf (fransi)": ["bsf", "banque saudi fransi"],
  "mazaya (al mazaya)": ["al mazaya", "mazaya"],
  "emsteel (emirates steel arkan)": ["emsteel", "emirates steel"],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function scoreMatch(entry: ReportTrackerEntry, app: companymasterapp): number {
  const appName = entry.appName.trim();
  const stock = entry.stockExchange.trim();
  const companyName = app.companyName.trim();
  if (!appName || !companyName) return 0;

  const na = normalize(appName);
  const nc = normalize(companyName);
  const ns = normalize(stock);
  const companyLower = companyName.toLowerCase();
  const appLower = appName.toLowerCase();

  if (na === nc) return 100;

  const aliases = APP_NAME_ALIASES[appLower] ?? [];
  for (const alias of aliases) {
    if (normalize(alias) === nc || nc.includes(normalize(alias))) return 95;
  }

  if (
    companyLower.startsWith(appLower) &&
    (companyName.length === appName.length ||
      " ([/".includes(companyName[appName.length] ?? ""))
  ) {
    return 90;
  }

  if (nc.startsWith(na) && na.length >= 3) return 85;

  const parenMatch = companyName.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const parenNorm = normalize(parenMatch[1]);
    if (parenNorm === na || parenNorm.startsWith(na) || na.startsWith(parenNorm)) {
      return 80;
    }
  }

  if (ns && (ns === nc || nc.startsWith(ns) || ns.startsWith(nc))) return 70;
  if (ns && na && (ns.includes(na) || nc.includes(ns))) return 50;

  const appTokens = appLower.match(/[a-z0-9]+/g) ?? [];
  const companyTokens = companyLower.match(/[a-z0-9]+/g) ?? [];
  if (
    appTokens[0] &&
    companyTokens[0] &&
    appTokens[0] === companyTokens[0] &&
    appTokens[0].length >= 3
  ) {
    return 40;
  }

  return 0;
}

const MIN_MATCH_SCORE = 40;

/**
 * Link report tracker rows to Company master-list clients by name heuristics.
 * Returns a new array with `irappClientId` populated when matched.
 */
export function matchReportEntriesToClients(
  entries: ReportTrackerEntry[],
  apps: companymasterapp[]
): ReportTrackerEntry[] {
  return entries.map((entry) => {
    let bestApp: companymasterapp | null = null;
    let bestScore = 0;

    for (const app of apps) {
      const score = scoreMatch(entry, app);
      if (score > bestScore) {
        bestScore = score;
        bestApp = app;
      }
    }

    if (!bestApp || bestScore < MIN_MATCH_SCORE) {
      return { ...entry, irappClientId: undefined };
    }

    return { ...entry, irappClientId: bestApp.id };
  });
}
