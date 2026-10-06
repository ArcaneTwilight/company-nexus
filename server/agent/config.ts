/**
 * Free-tier-friendly agent knobs (env-overridable).
 * Defaults leave headroom under typical Gemini free RPM (~10/min).
 */

function intEnv(name: string, fallback: number, min = 1): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, n);
}

export function agentConfig() {
  return {
    /** Max Gemini generateContent rounds per user message */
    maxToolRounds: intEnv("AGENT_MAX_TOOL_ROUNDS", 4),
    /** Prior chat turns sent to the model (user+assistant pairs count as 2) */
    historyTurns: intEnv("AGENT_HISTORY_TURNS", 6),
    /** Cap assistant output length */
    maxOutputTokens: intEnv("AGENT_MAX_OUTPUT_TOKENS", 1024),
    /** Global concurrent agent turns (across users on this process) */
    maxConcurrentTurns: intEnv("AGENT_MAX_CONCURRENT", 2),
    /** Soft global agent-turn rate (turns per minute) */
    globalTurnsPerMinute: intEnv("AGENT_GLOBAL_TPM", 6),
    /** Per-user concurrent agent turns */
    perUserConcurrent: intEnv("AGENT_PER_USER_CONCURRENT", 1),
    /** Per-user agent turns per day (UTC) */
    perUserDailyTurns: intEnv("AGENT_PER_USER_RPD", 40),
    /** Max wait in queue before rejecting */
    queueWaitMs: intEnv("AGENT_QUEUE_WAIT_MS", 25_000, 0),
    /** Gemini API calls per minute (token bucket) */
    geminiCallsPerMinute: intEnv("AGENT_GEMINI_RPM", 8),
    /** Answer cache TTL */
    cacheTtlMs: intEnv("AGENT_CACHE_TTL_MS", 60 * 60 * 1000, 0),
    /** Max cached answers */
    cacheMaxEntries: intEnv("AGENT_CACHE_MAX", 200),
  };
}

export const RETRIEVAL_BUDGET_LIMITS = {
  registrySearches: 2,
  summaries: 3,
  sections: 2,
  fullDocs: 1,
  legacyBodySearches: 1,
} as const;
