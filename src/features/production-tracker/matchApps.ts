import type { companymasterapp, ProductionTrackerEntry } from "../../types";

/** Explicit aliases when heuristic matching fails */
const CLIENT_NAME_ALIASES: Record<string, string[]> = {
  ejada: ["ejada"],
  "oq base industries": ["oqbi", "oq base"],
  "modon (q holding)": ["modon", "q holding"],
  etisalat: ["e&", "e& (etisalat and)", "etisalat and"],
  "emirates mobility": [
    "emirates mobility company",
    "emirate mobility company",
    "emobility",
    "edcad",
  ],
  "bank al jazira": ["baj", "bank aljazira", "al jazira"],
  clb: ["commercial bank", "commercial bank of dubai"],
  stg: ["saudi tadawul group", "tadawul group"],
  "perfect presentation (2p)": ["2p", "perfect presentation"],
  "solutions by stc": ["solutions", "stc solutions"],
  sib: ["saudi investment bank"],
  citic: ["citic limited", "citic ltd"],
  "capcom ltd.": ["capcom"],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function scoreMatch(clientName: string, app: companymasterapp): number {
  const name = clientName.trim();
  const companyName = app.companyName.trim();
  if (!name || !companyName) return 0;

  const na = normalize(name);
  const nc = normalize(companyName);
  const companyLower = companyName.toLowerCase();
  const nameLower = name.toLowerCase();

  if (na === nc) return 100;

  const aliases = CLIENT_NAME_ALIASES[nameLower] ?? [];
  for (const alias of aliases) {
    const aliasNorm = normalize(alias);
    if (aliasNorm === nc || nc.includes(aliasNorm) || aliasNorm.includes(nc)) {
      return 95;
    }
  }

  if (
    companyLower.startsWith(nameLower) &&
    (companyName.length === name.length ||
      " ([/".includes(companyName[name.length] ?? ""))
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

  if (nc.includes(na) && na.length >= 4) return 60;

  const nameTokens = nameLower.match(/[a-z0-9]+/g) ?? [];
  const companyTokens = companyLower.match(/[a-z0-9]+/g) ?? [];
  if (
    nameTokens[0] &&
    companyTokens[0] &&
    nameTokens[0] === companyTokens[0] &&
    nameTokens[0].length >= 3
  ) {
    return 40;
  }

  return 0;
}

const MIN_MATCH_SCORE = 40;

/**
 * Link production tracker rows to Company master-list clients by name heuristics.
 */
export function matchProductionEntriesToApps(
  entries: ProductionTrackerEntry[],
  apps: companymasterapp[]
): ProductionTrackerEntry[] {
  return entries.map((entry) => {
    let bestApp: companymasterapp | null = null;
    let bestScore = 0;

    for (const app of apps) {
      const score = scoreMatch(entry.clientName, app);
      if (score > bestScore) {
        bestScore = score;
        bestApp = app;
      }
    }

    if (!bestApp || bestScore < MIN_MATCH_SCORE) {
      return { ...entry, companyAppId: undefined };
    }

    return { ...entry, companyAppId: bestApp.id };
  });
}
