import type { KnowledgeDomain, KnowledgeMode, ResolvedKnowledgeMode } from "../types";

const MODE_DOMAINS: Record<ResolvedKnowledgeMode, KnowledgeDomain[]> = {
  support: ["support"],
  developer: ["developer"],
  clients: ["clients"],
  team: ["team"],
  reports: ["reports"],
  general: ["support", "developer", "clients", "team", "reports", "general"],
};

const INTENT_PATTERNS: Array<{ mode: ResolvedKnowledgeMode; patterns: RegExp[] }> = [
  {
    mode: "clients",
    patterns: [
      /\b(client|clients|company|companies|onboarding|live\s*version|stock\s*exchange|market)\b/i,
      /\b(pss|poc|android|ios)\s*(download|release|testing)?\b/i,
    ],
  },
  {
    mode: "team",
    patterns: [
      /\b(team|directory|who\s+is|contact|email|timezone|colleague|staff|member)\b/i,
      /\b(pss|dev)\s+(member|person|lead)\b/i,
    ],
  },
  {
    mode: "reports",
    patterns: [
      /\b(report|reports|deadline|deadlines|calendar|upload|release\s*date|quarterly)\b/i,
    ],
  },
  {
    mode: "developer",
    patterns: [
      /\b(code|api|sdk|deploy|build|git|firebase|firestore|typescript|react|bug|debug|architecture|kb|knowledge\s*base|developer)\b/i,
    ],
  },
  {
    mode: "support",
    patterns: [
      /\b(faq|support|how\s+do\s+i|how\s+to|troubleshoot|password|login|help\s+desk|customer)\b/i,
    ],
  },
];

export function domainsForMode(mode: ResolvedKnowledgeMode): KnowledgeDomain[] {
  return MODE_DOMAINS[mode];
}

export function detectKnowledgeMode(query: string): ResolvedKnowledgeMode {
  const q = query.trim();
  if (!q) return "general";

  let best: ResolvedKnowledgeMode | null = null;
  let bestScore = 0;
  let secondScore = 0;

  for (const { mode, patterns } of INTENT_PATTERNS) {
    let score = 0;
    for (const re of patterns) {
      if (re.test(q)) score += 1;
    }
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      best = mode;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  // Ambiguous (tie / near-tie) → general so domain filter stays wide rather than wrong.
  if (bestScore > 0 && best && bestScore > secondScore) {
    return best;
  }
  if (bestScore > 0 && best && secondScore === 0) {
    return best;
  }
  return "general";
}

export function parseKnowledgeMode(raw: unknown): KnowledgeMode {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const allowed: KnowledgeMode[] = [
    "support",
    "developer",
    "clients",
    "team",
    "reports",
    "general",
    "auto",
  ];
  return (allowed.includes(v as KnowledgeMode) ? v : "auto") as KnowledgeMode;
}

/**
 * Resolve UI/request knowledgeMode + query into a concrete mode and domain allowlist.
 */
export function resolveKnowledgeMode(
  query: string,
  selected?: KnowledgeMode | null
): { mode: ResolvedKnowledgeMode; allowedDomains: KnowledgeDomain[]; autoDetected: boolean } {
  const sel = selected && selected !== "auto" ? selected : null;
  if (sel) {
    return {
      mode: sel,
      allowedDomains: domainsForMode(sel),
      autoDetected: false,
    };
  }
  const detected = detectKnowledgeMode(query);
  return {
    mode: detected,
    allowedDomains: domainsForMode(detected),
    autoDetected: true,
  };
}
